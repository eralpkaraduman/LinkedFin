import { useQuery } from "@tanstack/react-query";

/**
 * Map of current scientific names to their synonyms/basionyms that
 * may have better Wikidata coverage (especially images).
 * This handles cases where taxonomic reclassification has split
 * the data across multiple Wikidata entries.
 */
const SCIENTIFIC_NAME_SYNONYMS: Record<string, string[]> = {
	// Chelon aurata (golden grey mullet) - images are on the old Liza aurata entry
	"Chelon aurata": ["Liza aurata"],
};

export interface WikidataSpecies {
	qid: string;
	description: string;
	descriptionLang: string;
	imageUrl?: string;
	imageUrls: string[];
	wikipediaUrl?: string;
}

interface WikidataSearchResult {
	search: Array<{
		id: string;
		label: string;
		description?: string;
	}>;
}

interface WikidataEntity {
	id: string;
	descriptions?: Record<
		string,
		{
			value: string;
			language: string;
		}
	>;
	claims?: {
		P18?: Array<{
			mainsnak: {
				datavalue?: {
					value: string;
				};
			};
		}>;
	};
	sitelinks?: {
		enwiki?: { url?: string; title?: string };
		trwiki?: { url?: string; title?: string };
	};
}

interface WikidataEntitiesResponse {
	entities: Record<string, WikidataEntity>;
}

async function searchWikidataEntity(
	scientificName: string,
): Promise<string | null> {
	const url = new URL("https://www.wikidata.org/w/api.php");
	url.searchParams.set("action", "wbsearchentities");
	url.searchParams.set("search", scientificName);
	url.searchParams.set("language", "en");
	url.searchParams.set("format", "json");
	url.searchParams.set("origin", "*");
	url.searchParams.set("limit", "1");

	const response = await fetch(url.toString());
	if (!response.ok) throw new Error("Failed to search Wikidata");

	const data: WikidataSearchResult = await response.json();
	return data.search?.[0]?.id ?? null;
}

async function getWikidataEntity(qid: string): Promise<WikidataEntity | null> {
	const url = new URL("https://www.wikidata.org/w/api.php");
	url.searchParams.set("action", "wbgetentities");
	url.searchParams.set("ids", qid);
	url.searchParams.set("props", "claims|descriptions|sitelinks/urls");
	url.searchParams.set("languages", "en|tr");
	url.searchParams.set("languagefallback", "1");
	url.searchParams.set("format", "json");
	url.searchParams.set("origin", "*");

	const response = await fetch(url.toString());
	if (!response.ok) throw new Error("Failed to fetch Wikidata entity");

	const data: WikidataEntitiesResponse = await response.json();
	return data.entities?.[qid] ?? null;
}

function getCommonsImageUrl(filename: string, width = 300): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`;
}

async function fetchWikidataSpecies(
	scientificName: string,
): Promise<WikidataSpecies | null> {
	const qid = await searchWikidataEntity(scientificName);
	if (!qid) return null;

	const entity = await getWikidataEntity(qid);
	if (!entity) return null;

	// Extract description with language fallback
	let description = "";
	let descriptionLang = "en";
	const descriptions = entity.descriptions;
	if (descriptions) {
		if (descriptions.en) {
			description = descriptions.en.value;
			descriptionLang = descriptions.en.language;
		} else if (descriptions.tr) {
			description = descriptions.tr.value;
			descriptionLang = descriptions.tr.language;
		} else {
			// Take any available description
			const firstDesc = Object.values(descriptions)[0];
			if (firstDesc) {
				description = firstDesc.value;
				descriptionLang = firstDesc.language;
			}
		}
	}

	// Extract all images from P18 (image property)
	const imageUrls: string[] = [];
	const p18Claims = entity.claims?.P18 ?? [];
	for (const claim of p18Claims) {
		const filename = claim.mainsnak?.datavalue?.value;
		if (filename) {
			imageUrls.push(getCommonsImageUrl(filename));
		}
	}
	const imageUrl = imageUrls[0];

	// Get Wikipedia URL (prefer English, fall back to Turkish)
	let wikipediaUrl: string | undefined;
	if (entity.sitelinks?.enwiki?.url) {
		wikipediaUrl = entity.sitelinks.enwiki.url;
	} else if (entity.sitelinks?.trwiki?.url) {
		wikipediaUrl = entity.sitelinks.trwiki.url;
	} else if (entity.sitelinks?.enwiki?.title) {
		wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(entity.sitelinks.enwiki.title)}`;
	} else if (entity.sitelinks?.trwiki?.title) {
		wikipediaUrl = `https://tr.wikipedia.org/wiki/${encodeURIComponent(entity.sitelinks.trwiki.title)}`;
	}

	return {
		qid,
		description,
		descriptionLang,
		imageUrl,
		imageUrls,
		wikipediaUrl,
	};
}

export function useWikidataSpecies(scientificName: string | null) {
	return useQuery({
		queryKey: ["wikidata", scientificName],
		queryFn: () =>
			scientificName ? fetchWikidataSpecies(scientificName) : null,
		enabled: !!scientificName,
	});
}
