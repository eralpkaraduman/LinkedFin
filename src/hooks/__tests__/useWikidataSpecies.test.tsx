// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useWikidataSpecies } from "../useWikidataSpecies";

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function makeWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

function jsonResponse(payload: unknown): Response {
	return {
		ok: true,
		json: async () => payload,
	} as Response;
}

test("returns null when scientific name is null (query disabled)", () => {
	const { result } = renderHook(() => useWikidataSpecies(null), {
		wrapper: makeWrapper(),
	});
	expect(result.current.data).toBeUndefined();
	expect(result.current.isLoading).toBe(false);
	expect(fetchMock).not.toHaveBeenCalled();
});

test("returns null when wikidata search has no result", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [] }));
	fetchMock.mockResolvedValue(jsonResponse({ query: { search: [] } }));

	const { result } = renderHook(() => useWikidataSpecies("Unknown sp."), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data).toBeNull();
});

test("returns species data with English description and image", async () => {
	fetchMock.mockResolvedValueOnce(
		jsonResponse({ search: [{ id: "Q42", label: "Salmon" }] }),
	);
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "Atlantic salmon", language: "en" } },
					claims: {
						P18: [{ mainsnak: { datavalue: { value: "Salmon.jpg" } } }],
					},
					sitelinks: {
						enwiki: { url: "https://en.wikipedia.org/wiki/Salmon" },
					},
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.qid).toBe("Q42");
	expect(result.current.data?.description).toBe("Atlantic salmon");
	expect(result.current.data?.descriptionLang).toBe("en");
	expect(result.current.data?.imageFile).toBe("Salmon.jpg");
	expect(result.current.data?.wikipediaUrl).toBe(
		"https://en.wikipedia.org/wiki/Salmon",
	);
});

test("falls back to Turkish description when no English one", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { tr: { value: "Som balığı", language: "tr" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockResolvedValue(jsonResponse({ query: { search: [] } }));

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.description).toBe("Som balığı");
	expect(result.current.data?.descriptionLang).toBe("tr");
});

test("falls back to first available description when no en/tr", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { fr: { value: "Saumon", language: "fr" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockResolvedValue(jsonResponse({ query: { search: [] } }));

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.description).toBe("Saumon");
	expect(result.current.data?.descriptionLang).toBe("fr");
});

test("falls back to Commons image search when Wikidata has no P18", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			query: {
				search: [
					{ title: "File:Penaeus.jpg" },
					{ title: "File:Notes.txt" }, // should be filtered out
					{ title: "File:Penaeus2.png" },
				],
			},
		}),
	);

	const { result } = renderHook(
		() => useWikidataSpecies("Penaeus kerathurus"),
		{ wrapper: makeWrapper() },
	);

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual([
		"Penaeus.jpg",
		"Penaeus2.png",
	]);
});

test("uses synonym lookup when scientific name is in synonym map and no images found", async () => {
	// Initial search and entity for "Chelon aurata" (no images, no Commons fallback)
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q1" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q1: {
					id: "Q1",
					descriptions: { en: { value: "Mullet", language: "en" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	// Synonym search for "Liza aurata" returns Q2
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q2" }] }));
	// Synonym entity has an image
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q2: {
					id: "Q2",
					descriptions: {},
					claims: {
						P18: [{ mainsnak: { datavalue: { value: "LizaAurata.jpg" } } }],
					},
					sitelinks: {},
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Chelon aurata"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual(["LizaAurata.jpg"]);
});

test("falls back to enwiki title-based URL when only title (no url) is present", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {
						P18: [{ mainsnak: { datavalue: { value: "Salmon.jpg" } } }],
					},
					sitelinks: { enwiki: { title: "Salmon" } },
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.wikipediaUrl).toBe(
		"https://en.wikipedia.org/wiki/Salmon",
	);
});

test("falls back to trwiki when only Turkish sitelink exists", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {
						P18: [{ mainsnak: { datavalue: { value: "Salmon.jpg" } } }],
					},
					sitelinks: { trwiki: { url: "https://tr.wikipedia.org/wiki/Som" } },
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.wikipediaUrl).toBe(
		"https://tr.wikipedia.org/wiki/Som",
	);
});

test("falls back to trwiki title-based URL when only Turkish title is present", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {
						P18: [{ mainsnak: { datavalue: { value: "Salmon.jpg" } } }],
					},
					sitelinks: { trwiki: { title: "Som balığı" } },
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.wikipediaUrl).toContain("tr.wikipedia.org/wiki/");
});

test("returns null when entity lookup fails after qid found", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(jsonResponse({ entities: {} }));
	fetchMock.mockResolvedValue(jsonResponse({ query: { search: [] } }));

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data).toBeNull();
});

test("Commons fallback returns empty list when network errors", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockRejectedValueOnce(new Error("network"));

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual([]);
});

test("Commons fallback returns empty list when response not ok", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockResolvedValueOnce({ ok: false } as Response);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual([]);
});

test("throws when Wikidata search fetch is not ok", async () => {
	fetchMock.mockResolvedValueOnce({ ok: false } as Response);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.error).toBeInstanceOf(Error);
});

test("throws when entity fetch is not ok", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce({ ok: false } as Response);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.error).toBeInstanceOf(Error);
});

test("returns raw Commons file names, not Special:FilePath URLs", async () => {
	// The hook used to hand components a
	// `commons.wikimedia.org/wiki/Special:FilePath/...` URL, which cost two
	// redirects per image. Components now build direct upload.wikimedia.org
	// URLs themselves, so the hook must not pre-encode or wrap the name.
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {
						P18: [
							{
								mainsnak: {
									datavalue: { value: "Trüsche Walchensee.jpg" },
								},
							},
						],
					},
					sitelinks: {},
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Lota lota"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFile).toBe("Trüsche Walchensee.jpg");
	expect(result.current.data?.imageFile).not.toContain("commons.wikimedia.org");
});

test("keeps every P18 image, in claim order, with the first as the default", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {
						P18: [
							{ mainsnak: { datavalue: { value: "First.jpg" } } },
							{ mainsnak: {} }, // no datavalue: skipped, not a hole
							{ mainsnak: { datavalue: { value: "Second.jpg" } } },
						],
					},
					sitelinks: {},
				},
			},
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Salmo salar"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual(["First.jpg", "Second.jpg"]);
	expect(result.current.data?.imageFile).toBe("First.jpg");
});

test("Commons fallback strips the File: prefix from search results", async () => {
	fetchMock.mockResolvedValueOnce(jsonResponse({ search: [{ id: "Q42" }] }));
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			entities: {
				Q42: {
					id: "Q42",
					descriptions: { en: { value: "x", language: "en" } },
					claims: {},
					sitelinks: {},
				},
			},
		}),
	);
	fetchMock.mockResolvedValueOnce(
		jsonResponse({
			query: { search: [{ title: "File:Boga (Boops boops), España.jpg" }] },
		}),
	);

	const { result } = renderHook(() => useWikidataSpecies("Boops boops"), {
		wrapper: makeWrapper(),
	});

	await waitFor(() => expect(result.current.isLoading).toBe(false));
	expect(result.current.data?.imageFiles).toEqual([
		"Boga (Boops boops), España.jpg",
	]);
});
