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

class OgTagsHandler {
	constructor(name, etymology, url) {
		this.name = name;
		this.etymology = etymology;
		this.url = url;
	}
	element(el) {
		const t = escapeHtml(`LinkedFin: ${this.name}`);
		const d = escapeHtml(this.etymology);
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

export async function onRequest({ request, next }) {
	const url = new URL(request.url);
	const accept = request.headers.get("accept") ?? "";

	// Only intercept /name/* HTML requests
	const match = url.pathname.match(/^\/name\/([^/]+)$/);
	if (!match || !accept.includes("text/html")) return next();

	const nameId = match[1];
	const response = await next();

	try {
		const database = await getDb();
		const row = database.selectObject(
			"SELECT name, etymology FROM names WHERE id = ? LIMIT 1",
			[nameId],
		);
		if (!row) return response;

		const rewritten = new HTMLRewriter()
			.on("head", new OgTagsHandler(row.name, row.etymology, url.href))
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
