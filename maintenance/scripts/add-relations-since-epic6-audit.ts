/**
 * Borrowing/variant relations found during the TREK-542 etymology audit
 *
 * Each relation below is documented by the source record's own etymology and by
 * an external reference (cited in `notes`). Speculative links were left out.
 *
 * borrowed_from / alternate_of both require the two names to be for the same
 * species; that is asserted before every insert.
 *
 * Run: pnpm tsx maintenance/scripts/add-relations-since-epic6-audit.ts
 *      pnpm db:validate
 */
import Database from "better-sqlite3";
import { NameRelationType, requiresSameSpecies } from "../../src/db/relations";

interface NewRelation {
	source: string;
	target: string;
	relation: string;
	notes: string;
}

const RELATIONS: NewRelation[] = [
	{
		source: "nm_0450",
		target: "nm_0493",
		relation: NameRelationType.BORROWED_FROM,
		notes:
			"Turkish uskumru from Modern Greek σκουμπρί skoumbrí; the existing link only reached the Ancient Greek σκόμβρος (Wiktionary, Nişanyan Sözlük)",
	},
	{
		source: "nm_0455",
		target: "nm_0457",
		relation: NameRelationType.BORROWED_FROM,
		notes:
			"Second element of taskurapu: Finnish rapu (older krapu) from Swedish krabba, as recorded for nm_0420 Rapu (Wiktionary)",
	},
	{
		source: "nm_0531",
		target: "nm_0244",
		relation: NameRelationType.BORROWED_FROM,
		notes: "French sprat borrowed from English sprat in the 18th century (fr.wiktionary: de l'anglais sprat)",
	},
	{
		source: "nm_0538",
		target: "nm_0535",
		relation: NameRelationType.BORROWED_FROM,
		notes:
			"Norwegian ansjos via Dutch ansjovis, from Spanish anchovas, from Ligurian anciôa (en.wiktionary: ansjos)",
	},
	{
		source: "nm_0536",
		target: "nm_0375",
		relation: NameRelationType.BORROWED_FROM,
		notes:
			"French anchois traces to Ancient Greek ἀφύη aphýē through Old Occitan anchoia, Ligurian anciôa and Vulgar Latin *apiuva (Wiktionnaire)",
	},
	{
		source: "nm_0438",
		target: "nm_0468",
		relation: NameRelationType.ALTERNATE_OF,
		notes:
			"Trancia (market name, the source of Turkish Trança) and Dentice corazziere (book name) are both Italian names for Dentex gibbosus",
	},
];

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	const getName = db.prepare("SELECT id, name, lang, species_id FROM names WHERE id = ?");
	const getRelation = db.prepare(
		"SELECT 1 FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?",
	);
	const insert = db.prepare(
		"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
	);

	console.log("=== TREK-542 relations ===\n");

	const apply = db.transaction(() => {
		for (const rel of RELATIONS) {
			const source = getName.get(rel.source) as { name: string; lang: string; species_id: string };
			const target = getName.get(rel.target) as { name: string; lang: string; species_id: string };
			if (!source) throw new Error(`${rel.source} not found`);
			if (!target) throw new Error(`${rel.target} not found`);
			if (requiresSameSpecies(rel.relation) && source.species_id !== target.species_id)
				throw new Error(
					`${rel.relation} requires same species: ${rel.source} (${source.species_id}) vs ${rel.target} (${target.species_id})`,
				);
			if (getRelation.get(rel.source, rel.target, rel.relation)) {
				console.log(`= ${rel.source} -${rel.relation}-> ${rel.target} already exists, skipped`);
				continue;
			}
			insert.run(rel.source, rel.target, rel.relation, rel.notes);
			console.log(
				`+ ${rel.source} (${source.lang} ${source.name}) -${rel.relation}-> ${rel.target} (${target.lang} ${target.name})`,
			);
			console.log(`  ${rel.notes}`);
		}
	});

	apply();
	db.close();
	console.log("\nDone. Run: pnpm db:validate");
}

main();
