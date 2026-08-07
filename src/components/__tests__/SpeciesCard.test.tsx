// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { renderWithProviders } from "#/test/render";
import { SpeciesCard } from "../SpeciesCard";

const wikidataMock = vi.fn();

vi.mock("#/hooks/useWikidataSpecies", () => ({
	useWikidataSpecies: (name: string) => wikidataMock(name),
}));

beforeEach(() => {
	wikidataMock.mockReset();
});

test("renders the scientific name and a link to the species page", async () => {
	wikidataMock.mockReturnValue({ data: undefined, isLoading: false });
	renderWithProviders(
		<SpeciesCard speciesId="sp_001" scientificName="Salmo salar" />,
	);

	expect(await screen.findByText("Salmo salar")).toBeInTheDocument();
	const link = screen.getByRole("link");
	expect(link.getAttribute("href")).toContain("sp_001");
});

test("shows loading placeholder while wikidata is loading", async () => {
	wikidataMock.mockReturnValue({ data: undefined, isLoading: true });
	const { container } = renderWithProviders(
		<SpeciesCard speciesId="sp_001" scientificName="Salmo salar" />,
	);
	expect(await screen.findByText("Salmo salar")).toBeInTheDocument();
	expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
		0,
	);
});

test("renders an image whose src is derived from the wikidata image file", async () => {
	wikidataMock.mockReturnValue({
		data: {
			imageFile: "Salmon.jpg",
			imageFiles: ["Salmon.jpg"],
			description: "x",
		},
		isLoading: false,
	});
	const { container } = renderWithProviders(
		<SpeciesCard speciesId="sp_001" scientificName="Salmo salar" />,
	);
	expect(await screen.findByText("Salmo salar")).toBeInTheDocument();
	const matching = Array.from(container.querySelectorAll("img")).find((img) =>
		img.getAttribute("src")?.includes("/120px-Salmon.jpg"),
	);
	expect(matching).toBeDefined();
});
