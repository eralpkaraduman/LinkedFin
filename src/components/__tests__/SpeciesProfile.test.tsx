// @vitest-environment jsdom
import { screen, waitFor } from "@testing-library/react";
import type { FishName } from "#/lib/types";
import { renderWithProviders } from "#/test/render";
import { SpeciesProfile } from "../SpeciesProfile";

const wikidataMock = vi.fn();

vi.mock("#/hooks/useWikidataSpecies", () => ({
	useWikidataSpecies: (name: string) => wikidataMock(name),
}));

// embla-carousel-react requires browser APIs jsdom lacks; stub the UI primitives.
vi.mock("#/components/ui/carousel", () => {
	type Props = { children?: React.ReactNode; className?: string };
	return {
		Carousel: ({ children }: Props) => (
			<div data-testid="carousel">{children}</div>
		),
		CarouselContent: ({ children }: Props) => <div>{children}</div>,
		CarouselItem: ({ children }: Props) => <div>{children}</div>,
		CarouselPrevious: () => <button type="button">prev</button>,
		CarouselNext: () => <button type="button">next</button>,
	};
});

const sampleNames: FishName[] = [
	{
		id: "nm_0001",
		name: "Levrek",
		lang: "tur",
		transliteration: "Levrek",
		phonetic: "lev.ɾek",
		etymology: "Greek labrax.",
		measurement_unit: null,
		measurement_min: null,
		measurement_max: null,
		species_id: "sp_001",
		region: "Turkey",
		scientific_name: "Dicentrarchus labrax",
		species_notes: null,
		language: "Turkish",
	},
];

beforeEach(() => {
	wikidataMock.mockReset();
});

test("shows skeleton while loading", async () => {
	wikidataMock.mockReturnValue({
		data: undefined,
		isLoading: true,
		error: null,
	});
	const { container } = renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	await waitFor(() => {
		expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
			0,
		);
	});
});

test("shows error message when wikidata fetch fails", async () => {
	wikidataMock.mockReturnValue({
		data: undefined,
		isLoading: false,
		error: new Error("network"),
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	expect(
		await screen.findByText(/could not load information/i),
	).toBeInTheDocument();
});

test("renders single image and Wikipedia link when one image exists", async () => {
	wikidataMock.mockReturnValue({
		data: {
			imageFile: "Img.jpg",
			imageFiles: ["Img.jpg"],
			wikipediaUrl: "https://en.wikipedia.org/wiki/X",
			description: "A real description.",
		},
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	expect(await screen.findByText("A real description.")).toBeInTheDocument();
	const wiki = screen.getByText("Wikipedia").closest("a");
	expect(wiki?.getAttribute("href")).toBe("https://en.wikipedia.org/wiki/X");
});

test("renders multi-image branch with image-counter dots", async () => {
	wikidataMock.mockReturnValue({
		data: {
			imageFile: "A.jpg",
			imageFiles: ["A.jpg", "B.jpg"],
			description: "Multi.",
		},
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	const dots = await screen.findAllByLabelText(/Go to image/);
	expect(dots.length).toBe(2);
});

test("replaces vague Wikidata description with species notes when provided", async () => {
	wikidataMock.mockReturnValue({
		data: {
			imageFiles: [],
			description: "species of fish",
		},
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile
			speciesId="sp_001"
			scientificName="Dicentrarchus labrax"
			speciesNotes="Detailed local notes."
		/>,
	);
	expect(await screen.findByText("Detailed local notes.")).toBeInTheDocument();
	expect(screen.queryByText("species of fish")).not.toBeInTheDocument();
});

test("shows species notes as secondary info when Wikidata description is good", async () => {
	wikidataMock.mockReturnValue({
		data: { imageFiles: [], description: "A specific real description." },
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile
			speciesId="sp_001"
			scientificName="Dicentrarchus labrax"
			speciesNotes="Local field note."
		/>,
	);
	expect(
		await screen.findByText("A specific real description."),
	).toBeInTheDocument();
	expect(screen.getByText("Local field note.")).toBeInTheDocument();
});

test("falls back to species notes if Wikidata has no description", async () => {
	wikidataMock.mockReturnValue({
		data: { imageFiles: [], description: "" },
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile
			speciesId="sp_001"
			scientificName="Dicentrarchus labrax"
			speciesNotes="Only local note."
		/>,
	);
	expect(await screen.findByText("Only local note.")).toBeInTheDocument();
});

test("shows no-data message when nothing is available", async () => {
	wikidataMock.mockReturnValue({
		data: { imageFiles: [], description: "" },
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	expect(
		await screen.findByText(/no wikipedia article found/i),
	).toBeInTheDocument();
});

test("renders the names list when species has names", async () => {
	wikidataMock.mockReturnValue({
		data: { imageFiles: [], description: "x" },
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
		{
			database: {
				getNamesBySpecies: () => sampleNames,
			},
		},
	);
	expect(await screen.findByText(/Names \(1\)/i)).toBeInTheDocument();
	expect(screen.getByText("Levrek")).toBeInTheDocument();
});

test("renders Report Issue link with prefilled URL", async () => {
	wikidataMock.mockReturnValue({
		data: { imageFiles: [], description: "x" },
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	const text = await screen.findByText(/report an update/i);
	const link = text.closest("a");
	expect(link?.getAttribute("href")).toContain("issues/new");
	expect(link?.getAttribute("href")).toContain("sp_001");
});

test("falls back to trwiki when enwiki not available", async () => {
	wikidataMock.mockReturnValue({
		data: {
			imageFiles: [],
			description: "x",
			wikipediaUrl: "https://tr.wikipedia.org/wiki/X",
		},
		isLoading: false,
		error: null,
	});
	renderWithProviders(
		<SpeciesProfile speciesId="sp_001" scientificName="Dicentrarchus labrax" />,
	);
	const wiki = await screen.findByText("Wikipedia");
	expect(wiki.closest("a")?.getAttribute("href")).toBe(
		"https://tr.wikipedia.org/wiki/X",
	);
});
