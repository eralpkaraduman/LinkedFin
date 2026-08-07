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
	/**
	 * Commons file names (e.g. `Salmon.jpg`), not URLs. The rendering component
	 * turns them into direct `upload.wikimedia.org` thumbnail URLs at whatever
	 * widths it actually needs — see `src/lib/commonsImage.ts`.
	 */
	imageFile?: string;
	imageFiles: string[];
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

interface CommonsSearchResult {
	query?: {
		search?: Array<{
			title: string;
		}>;
	};
}

/**
 * Search Wikimedia Commons for images of a species when Wikidata has no P18.
 * This is a fallback for species whose Wikidata entries lack image claims
 * but have images uploaded to Commons (e.g., Penaeus kerathurus).
 */
async function searchCommonsImages(
	scientificName: string,
	limit = 5,
): Promise<string[]> {
	const url = new URL("https://commons.wikimedia.org/w/api.php");
	url.searchParams.set("action", "query");
	url.searchParams.set("list", "search");
	url.searchParams.set("srsearch", scientificName);
	url.searchParams.set("srnamespace", "6"); // File namespace
	url.searchParams.set("srlimit", String(limit));
	url.searchParams.set("format", "json");
	url.searchParams.set("origin", "*");

	try {
		const response = await fetch(url.toString());
		if (!response.ok) return [];

		const data: CommonsSearchResult = await response.json();
		const results = data.query?.search ?? [];

		// Extract filenames from "File:..." titles, filter to image extensions
		return results
			.map((r) => r.title.replace(/^File:/, ""))
			.filter((name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name));
	} catch {
		return [];
	}
}

function extractImageFiles(entity: WikidataEntity): string[] {
	const files: string[] = [];
	const p18Claims = entity.claims?.P18 ?? [];
	for (const claim of p18Claims) {
		const filename = claim.mainsnak?.datavalue?.value;
		if (filename) {
			files.push(filename);
		}
	}
	return files;
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
	let imageFiles = extractImageFiles(entity);

	// If no images found, try synonyms that may have better Wikidata coverage
	if (imageFiles.length === 0) {
		const synonyms = SCIENTIFIC_NAME_SYNONYMS[scientificName];
		if (synonyms) {
			for (const synonym of synonyms) {
				const synonymQid = await searchWikidataEntity(synonym);
				if (synonymQid) {
					const synonymEntity = await getWikidataEntity(synonymQid);
					if (synonymEntity) {
						const synonymImages = extractImageFiles(synonymEntity);
						if (synonymImages.length > 0) {
							imageFiles = synonymImages;
							break;
						}
					}
				}
			}
		}
	}

	// Final fallback: search Wikimedia Commons directly
	// This handles species like Penaeus kerathurus where Wikidata
	// has no P18 image claim but Commons has images uploaded
	if (imageFiles.length === 0) {
		imageFiles = await searchCommonsImages(scientificName);
	}

	const imageFile = imageFiles[0];

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
		imageFile,
		imageFiles,
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
