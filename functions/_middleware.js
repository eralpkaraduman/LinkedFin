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

const GENERIC = {
	title: "LinkedFin - Fish Names Etymology Database",
	description:
		"Explore the origins and meanings of fish names across languages. A comprehensive etymology database linking Mediterranean fish names from Turkish, Greek, Arabic, and more.",
};

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

async function lookupName(db, nameId) {
	const row = await db
		.prepare("SELECT name, etymology FROM names WHERE id = ? LIMIT 1")
		.bind(nameId)
		.first();
	if (!row) return null;
	return {
		title: `LinkedFin: ${row.name}`,
		description: row.etymology,
	};
}

async function lookupSpecies(db, speciesId) {
	const species = await db
		.prepare("SELECT scientific_name FROM species WHERE id = ? LIMIT 1")
		.bind(speciesId)
		.first();
	if (!species) return null;

	const { results: names } = await db
		.prepare("SELECT name FROM names WHERE species_id = ? ORDER BY id")
		.bind(speciesId)
		.all();
	const nameList = names.map((n) => n.name).join(", ");

	return {
		title: `LinkedFin: ${species.scientific_name}`,
		description: truncate(nameList, 500) || species.scientific_name,
	};
}

export async function onRequest(context) {
	const { request, next, env } = context;
	const url = new URL(request.url);
	const accept = request.headers.get("accept") ?? "";

	if (!accept.includes("text/html")) return next();

	const response = await next();

	// Match /name/$id
	const nameMatch = url.pathname.match(/^\/name\/([^/]+)$/);
	// Match /?species=sp_XXX on homepage
	const speciesId =
		url.pathname === "/" ? url.searchParams.get("species") : null;

	let og = null;
	try {
		if (nameMatch) {
			og = await lookupName(env.DB, nameMatch[1]);
		} else if (speciesId) {
			og = await lookupSpecies(env.DB, speciesId);
		}
	} catch (e) {
		console.error("OG lookup error:", e);
	}

	if (!og) {
		og = GENERIC;
	}

	const rewritten = new HTMLRewriter()
		.on("head", new OgTagsHandler(og.title, og.description, url.href))
		.transform(response);

	const cached = new Response(rewritten.body, rewritten);
	cached.headers.set(
		"Cache-Control",
		"public, max-age=604800, s-maxage=604800",
	);
	return cached;
}
