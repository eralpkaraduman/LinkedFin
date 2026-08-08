// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import type { FishName, Relation } from "#/lib/types";
import { renderWithProviders } from "#/test/render";
import { NameDetail } from "../NameDetail";

function makeName(over: Partial<FishName> = {}): FishName {
	return {
		id: "nm_0001",
		name: "Levrek",
		lang: "tur",
		transliteration: "Levrek",
		phonetic: "lev.ɾek",
		etymology: "From Greek labrax.",
		measurement_unit: null,
		measurement_min: null,
		measurement_max: null,
		species_id: "sp_001",
		region_id: "turkey",
		region: "Turkey",
		scientific_name: "Dicentrarchus labrax",
		species_notes: null,
		language: "Turkish",
		...over,
	};
}

function dbWith(names: FishName[], relations: Relation[] = []) {
	return {
		names,
		relations,
		getNameById: (id: string) => names.find((n) => n.id === id),
		getNamesBySpecies: (sid: string) =>
			names.filter((n) => n.species_id === sid),
	};
}

test("renders id, region, language, transliteration, IPA, and etymology", async () => {
	const name = makeName();
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});

	expect(await screen.findByText("#nm_0001")).toBeInTheDocument();
	expect(screen.getByText(/Turkey/)).toBeInTheDocument();
	expect(screen.getByText("Turkish")).toBeInTheDocument();
	expect(screen.getByText("Levrek")).toBeInTheDocument();
	expect(screen.getByText("lev.ɾek")).toBeInTheDocument();
	expect(screen.getByText("From Greek labrax.")).toBeInTheDocument();
});

test("hides phonetic when wrapped in brackets", async () => {
	const name = makeName({ phonetic: "[skipped]" });
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText(/From Greek/)).toBeInTheDocument();
	expect(screen.queryByText("[skipped]")).not.toBeInTheDocument();
});

test("renders measurement when present", async () => {
	const name = makeName({
		measurement_unit: "cm",
		measurement_min: 30,
		measurement_max: 80,
	});
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText(/30 — 80 cm/)).toBeInTheDocument();
});

test("renders ∞ when measurement_max missing", async () => {
	const name = makeName({
		measurement_unit: "cm",
		measurement_min: 30,
		measurement_max: null,
	});
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText(/30 — ∞ cm/)).toBeInTheDocument();
});

test("renders 'Origin uncertain' when no etymology", async () => {
	const name = makeName({ etymology: "" });
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText("Origin uncertain")).toBeInTheDocument();
});

test("renders species notes when present", async () => {
	const name = makeName({ species_notes: "A pelagic predator." });
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText("A pelagic predator.")).toBeInTheDocument();
});

test("renders alternates section with cross-region links", async () => {
	const a = makeName({ id: "nm_0001", region: "Turkey", name: "Levrek" });
	const b = makeName({ id: "nm_0002", region: "Greece", name: "Lavraki" });
	const relations: Relation[] = [
		{ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" },
	];
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a, b], relations),
	});
	expect(await screen.findByText(/Alternates/)).toBeInTheDocument();
	expect(screen.getAllByText("Lavraki")[0]).toBeInTheDocument();
	expect(screen.getAllByText(/Greece/).length).toBeGreaterThan(0);
});

test("renders borrowed-from section", async () => {
	const a = makeName({ id: "nm_0001", name: "Levrek" });
	const src = makeName({
		id: "nm_0050",
		name: "Labrax",
		species_id: "sp_other",
	});
	const relations: Relation[] = [
		{ source_id: "nm_0001", target_id: "nm_0050", relation: "borrowed_from" },
	];
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a, src], relations),
	});
	expect(await screen.findByText(/Borrowed from/)).toBeInTheDocument();
	expect(screen.getByText("Labrax")).toBeInTheDocument();
});

test("renders lent-to section", async () => {
	const a = makeName({ id: "nm_0001", name: "Labrax" });
	const dst = makeName({ id: "nm_0050", name: "Levrek" });
	const relations: Relation[] = [
		{ source_id: "nm_0050", target_id: "nm_0001", relation: "borrowed_from" },
	];
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a, dst], relations),
	});
	expect(await screen.findByText(/Lent to/)).toBeInTheDocument();
});

test("renders confused-with warning section", async () => {
	const a = makeName({ id: "nm_0001", name: "Levrek" });
	const c = makeName({
		id: "nm_0099",
		name: "Lüfer",
		species_id: "sp_other",
		scientific_name: "Pomatomus saltatrix",
	});
	const relations: Relation[] = [
		{ source_id: "nm_0001", target_id: "nm_0099", relation: "confused_with" },
	];
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a, c], relations),
	});
	expect(await screen.findByText(/Often confused with/)).toBeInTheDocument();
	expect(screen.getByText("Lüfer")).toBeInTheDocument();
	expect(screen.getByText(/Pomatomus saltatrix/)).toBeInTheDocument();
});

test("renders male-of section pointing to the general name", async () => {
	const male = makeName({ id: "nm_M", name: "MaleName", species_id: "sp_001" });
	const general = makeName({
		id: "nm_G",
		name: "GeneralName",
		species_id: "sp_002",
	});
	const relations: Relation[] = [
		{ source_id: "nm_M", target_id: "nm_G", relation: "male_of" },
	];
	renderWithProviders(<NameDetail name={male} />, {
		database: dbWith([male, general], relations),
	});
	expect(await screen.findByText(/Male of/)).toBeInTheDocument();
	expect(screen.getByText("GeneralName")).toBeInTheDocument();
});

test("renders sex-variants section when name has male/female sub-names", async () => {
	const general = makeName({
		id: "nm_G",
		name: "GeneralName",
		species_id: "sp_001",
	});
	const m = makeName({ id: "nm_M", name: "MaleName", species_id: "sp_002" });
	const f = makeName({ id: "nm_F", name: "FemaleName", species_id: "sp_003" });
	const relations: Relation[] = [
		{ source_id: "nm_M", target_id: "nm_G", relation: "male_of" },
		{ source_id: "nm_F", target_id: "nm_G", relation: "female_of" },
	];
	renderWithProviders(<NameDetail name={general} />, {
		database: dbWith([general, m, f], relations),
	});
	expect(await screen.findByText(/Sex variants/)).toBeInTheDocument();
	expect(screen.getByText("MaleName")).toBeInTheDocument();
	expect(screen.getByText("FemaleName")).toBeInTheDocument();
	expect(screen.getByText(/\(male\)/)).toBeInTheDocument();
	expect(screen.getByText(/\(female\)/)).toBeInTheDocument();
});

test("renders same-species names", async () => {
	const a = makeName({ id: "nm_0001", name: "Levrek", region: "Turkey" });
	const b = makeName({
		id: "nm_0002",
		name: "Lavraki",
		region: "Greece",
		species_id: "sp_001",
	});
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a, b]),
	});
	expect(
		await screen.findByText(/Same species, different names/),
	).toBeInTheDocument();
	expect(screen.getAllByText("Lavraki")[0]).toBeInTheDocument();
});

test("renders size progression chain with arrows and current marker", async () => {
	const small = makeName({
		id: "nm_S",
		name: "Smolt",
		species_id: "sp_X",
		measurement_unit: "cm",
		measurement_min: 5,
		measurement_max: 10,
	});
	const mid = makeName({
		id: "nm_0001",
		name: "Salmon",
		species_id: "sp_X",
		measurement_unit: "cm",
		measurement_min: 30,
		measurement_max: 60,
	});
	const big = makeName({
		id: "nm_B",
		name: "King",
		species_id: "sp_Y", // different species so not in "Same species" section
		measurement_unit: "cm",
		measurement_min: 80,
		measurement_max: null,
	});
	const relations: Relation[] = [
		{ source_id: "nm_S", target_id: "nm_0001", relation: "smaller_than" },
		{ source_id: "nm_0001", target_id: "nm_B", relation: "smaller_than" },
	];
	renderWithProviders(<NameDetail name={mid} />, {
		database: dbWith([small, mid, big], relations),
	});
	expect(await screen.findByText("Progression")).toBeInTheDocument();
	expect(screen.getAllByText("Smolt").length).toBeGreaterThan(0);
	expect(screen.getAllByText("Salmon").length).toBeGreaterThan(0);
	expect(screen.getByText("King")).toBeInTheDocument();
});

test("renders Report Issue link with prefilled URL", async () => {
	const name = makeName();
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	const link = (await screen.findByText(/report an issue/i)).closest("a");
	expect(link?.getAttribute("href")).toContain("issues/new");
	expect(link?.getAttribute("href")).toContain("nm_0001");
});

test("safely skips relations whose target name is missing from the database", async () => {
	const a = makeName({ id: "nm_0001", name: "Levrek" });
	// Relation references a name that isn't in the names list.
	const relations: Relation[] = [
		{
			source_id: "nm_0001",
			target_id: "nm_missing",
			relation: "borrowed_from",
		},
		{
			source_id: "nm_missing",
			target_id: "nm_0001",
			relation: "borrowed_from",
		},
		{ source_id: "nm_0001", target_id: "nm_missing", relation: "alternate_of" },
		{
			source_id: "nm_0001",
			target_id: "nm_missing",
			relation: "confused_with",
		},
		{ source_id: "nm_0001", target_id: "nm_missing", relation: "male_of" },
		{ source_id: "nm_0001", target_id: "nm_missing", relation: "female_of" },
		{ source_id: "nm_missing", target_id: "nm_0001", relation: "male_of" },
		{ source_id: "nm_missing", target_id: "nm_0001", relation: "female_of" },
		{ source_id: "nm_0001", target_id: "nm_missing", relation: "smaller_than" },
	];
	renderWithProviders(<NameDetail name={a} />, {
		database: dbWith([a], relations),
	});
	// Should render without crashing — the null-fallback branches exit cleanly.
	expect(await screen.findByText("#nm_0001")).toBeInTheDocument();
});

test("renders female-only relation (separate from male)", async () => {
	const female = makeName({
		id: "nm_F",
		name: "FemaleOnly",
		species_id: "sp_001",
	});
	const general = makeName({
		id: "nm_G",
		name: "GeneralName",
		species_id: "sp_002",
	});
	const relations: Relation[] = [
		{ source_id: "nm_F", target_id: "nm_G", relation: "female_of" },
	];
	renderWithProviders(<NameDetail name={female} />, {
		database: dbWith([female, general], relations),
	});
	expect(await screen.findByText(/Female of/)).toBeInTheDocument();
	expect(screen.getByText("GeneralName")).toBeInTheDocument();
});

test("renders only meta info when no optional fields are present", async () => {
	const name = makeName({
		language: "",
		measurement_unit: null,
		transliteration: "",
		phonetic: "",
		etymology: "",
	});
	renderWithProviders(<NameDetail name={name} />, {
		database: dbWith([name]),
	});
	expect(await screen.findByText("#nm_0001")).toBeInTheDocument();
	expect(screen.getByText("Origin uncertain")).toBeInTheDocument();
	// Fields grid is not rendered
	expect(screen.queryByText("Language")).not.toBeInTheDocument();
});
