import initSqlite from "@sqlite.org/sqlite-wasm";

let db = null;

async function getDb() {
	if (db) return db;
	const sqlite3 = await initSqlite({ print: () => {}, printErr: () => {} });
	const res = await fetch("https://linkedfin.net/fish.db");
	const buf = await res.arrayBuffer();
	const bytes = new Uint8Array(buf);
	db = new sqlite3.oo1.DB();
	const p = sqlite3.wasm.allocFromTypedArray(bytes);
	const rc = sqlite3.capi.sqlite3_deserialize(
		db.pointer,
		"main",
		p,
		bytes.length,
		bytes.length,
		sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
			sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
	);
	if (rc !== 0) throw new Error(`sqlite3_deserialize failed: ${rc}`);
	return db;
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function truncate(str, max) {
	if (str.length <= max) return str;
	const cut = str.lastIndexOf(", ", max - 1);
	return `${str.slice(0, cut > 0 ? cut : max)}...`;
}

class OgTagsHandler {
	constructor(title, description, url) {
		this.title = title;
		this.description = description;
		this.url = url;
	}
	element(el) {
		const t = escapeHtml(this.title);
		const d = escapeHtml(this.description);
		const u = escapeHtml(this.url);
		const img = "https://linkedfin.net/og-image.png";
		el.append(
			`<meta property="og:type" content="website" />` +
				`<meta property="og:site_name" content="LinkedFin" />` +
				`<meta property="og:url" content="${u}" />` +
				`<meta property="og:title" content="${t}" />` +
				`<meta property="og:description" content="${d}" />` +
				`<meta property="og:image" content="${img}" />` +
				`<meta property="og:image:width" content="1200" />` +
				`<meta property="og:image:height" content="630" />` +
				`<meta property="og:image:type" content="image/png" />` +
				`<meta name="twitter:card" content="summary_large_image" />` +
				`<meta name="twitter:title" content="${t}" />` +
				`<meta name="twitter:description" content="${d}" />` +
				`<meta name="twitter:image" content="${img}" />`,
			{ html: true },
		);
	}
}

function lookupName(database, nameId) {
	const row = database.selectObject(
		"SELECT name, etymology FROM names WHERE id = ? LIMIT 1",
		[nameId],
	);
	if (!row) return null;
	return {
		title: `LinkedFin: ${row.name}`,
		description: row.etymology,
	};
}

function lookupSpecies(database, speciesId) {
	const species = database.selectObject(
		"SELECT scientific_name, notes FROM species WHERE id = ? LIMIT 1",
		[speciesId],
	);
	if (!species) return null;

	const names = database.selectObjects(
		"SELECT name FROM names WHERE species_id = ? ORDER BY id",
		[speciesId],
	);
	const nameList = names.map((n) => n.name).join(", ");

	let description = species.notes || species.scientific_name;
	if (nameList) {
		description += ` — ${truncate(nameList, 200 - description.length)}`;
	}

	return {
		title: `LinkedFin: ${species.scientific_name}`,
		description,
	};
}

export async function onRequest({ request, next }) {
	const url = new URL(request.url);
	const accept = request.headers.get("accept") ?? "";

	if (!accept.includes("text/html")) return next();

	// Match /name/$id
	const nameMatch = url.pathname.match(/^\/name\/([^/]+)$/);
	// Match /?species=sp_XXX on homepage
	const speciesId = url.pathname === "/" ? url.searchParams.get("species") : null;

	if (!nameMatch && !speciesId) return next();

	const response = await next();

	try {
		const database = await getDb();

		const og = nameMatch
			? lookupName(database, nameMatch[1])
			: lookupSpecies(database, speciesId);

		if (!og) return response;

		const rewritten = new HTMLRewriter()
			.on("head", new OgTagsHandler(og.title, og.description, url.href))
			.transform(response);

		const cached = new Response(rewritten.body, rewritten);
		cached.headers.set(
			"Cache-Control",
			"public, max-age=604800, s-maxage=604800",
		);
		return cached;
	} catch (e) {
		console.error("OG middleware error:", e);
		return response;
	}
}
