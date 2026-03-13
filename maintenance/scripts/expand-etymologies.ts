/**
 * Expand etymologies: add meanings/derivations for foreign words mentioned
 *
 * This script:
 * 1. Appends deeper etymological chains to existing etymology fields
 * 2. Fixes one incorrect derivation chain (nm_0226)
 * 3. Adds missing borrowed_from relations
 *
 * All etymology changes are APPEND-ONLY (no existing text is removed).
 * Research sources: Wiktionary, Etymonline, Beekes' Etymological Dictionary of Greek
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Etymology Expansion Script ===\n");

// Helper: append a line to an existing etymology
function appendEtymology(id: string, appendLine: string) {
	const row = db.query("SELECT etymology FROM names WHERE id = ?").get(id) as {
		etymology: string;
	} | null;
	if (!row) {
		console.log(`  SKIP ${id}: not found`);
		return;
	}
	const newEtymology = row.etymology + "\n" + appendLine;
	db.run("UPDATE names SET etymology = ? WHERE id = ?", [newEtymology, id]);
	console.log(`  OK ${id}: appended "${appendLine}"`);
}

// Helper: replace a specific line in etymology (for fixing errors)
function replaceInEtymology(id: string, oldText: string, newText: string) {
	const row = db.query("SELECT etymology FROM names WHERE id = ?").get(id) as {
		etymology: string;
	} | null;
	if (!row) {
		console.log(`  SKIP ${id}: not found`);
		return;
	}
	if (!row.etymology.includes(oldText)) {
		console.log(`  SKIP ${id}: text not found: "${oldText}"`);
		return;
	}
	const newEtymology = row.etymology.replace(oldText, newText);
	db.run("UPDATE names SET etymology = ? WHERE id = ?", [newEtymology, id]);
	console.log(`  OK ${id}: replaced "${oldText}" → "${newText}"`);
}

// ============================================================
// PASS 4: Update etymologies (append only, except one fix)
// ============================================================

console.log("--- Pass 4: Expanding etymologies ---\n");

// nm_0001: Patlakgöz mercan - expand marjān origin
appendEtymology(
	"nm_0001",
	"↳ marjān from Greek μαργαρίτης margarítēs (pearl) via Syriac"
);

// nm_0018: Red mullet - add μύλλος meaning
replaceInEtymology(
	"nm_0018",
	"↳ From Greek μύλλος mýllos",
	"↳ From Greek μύλλος mýllos (a Pontic fish name, origin uncertain)"
);

// nm_0020: Defneyaprağı - add defne origin
replaceInEtymology(
	"nm_0020",
	"defne: laurel, yaprak: leaf",
	"defne: laurel (from Greek δάφνη dáphnē, laurel tree), yaprak: leaf"
);

// nm_0029: Ince lidaki - expand λιθάκι
appendEtymology(
	"nm_0029",
	"↳ λιθάκι diminutive of λίθος líthos (stone)"
);

// nm_0030: Lidaki - expand λιθάκι
appendEtymology(
	"nm_0030",
	"↳ Diminutive of λίθος líthos (stone)"
);

// nm_0031: Kaba lidaki - expand λιθάκι
appendEtymology(
	"nm_0031",
	"↳ λιθάκι diminutive of λίθος líthos (stone)"
);

// nm_0039: White grouper - expand garoupa
appendEtymology(
	"nm_0039",
	"↳ garoupa origin uncertain, possibly from a South American indigenous language"
);

// nm_0048: Mercan - expand marjān chain
appendEtymology(
	"nm_0048",
	"↳ marjān from Greek μαργαρίτης margarítēs (pearl) via Syriac"
);

// nm_0050: مرجان - expand marjān chain
appendEtymology(
	"nm_0050",
	"↳ Possibly from Greek μαργαρίτης margarítēs (pearl) via Syriac; semantic shift from pearl to coral"
);

// nm_0051: Common pandora - expand Pandora meaning
replaceInEtymology(
	"nm_0051",
	"From Greek Πανδώρα Pandṓra",
	"From Greek Πανδώρα Pandṓra (all-gifted)\n↳ From πᾶν pân (all) + δῶρον dôron (gift)"
);

// nm_0064: Striped red mullet - expand surmulet
replaceInEtymology(
	"nm_0064",
	"red mullet: from French surmulet",
	"red mullet: from French surmulet\n↳ From Old French sor (reddish-brown) + mulet (mullet)"
);

// nm_0068: Atlantic bonito - expand bonito
appendEtymology(
	"nm_0068",
	"↳ From Latin bonus (good)"
);

// nm_0104: Caramote prawn - expand cammarus
appendEtymology(
	"nm_0104",
	"↳ From Greek κάμμαρος kámmaros (lobster)"
);

// nm_0117: European crayfish - expand crevice
appendEtymology(
	"nm_0117",
	"↳ From Frankish *krebit, related to German Krebs (crab)"
);

// nm_0163: Zander - expand sandat
appendEtymology(
	"nm_0163",
	"↳ Possibly from Slavic, compare Proto-Slavic *sǫdakъ (pikeperch)"
);

// nm_0177: Crucian carp - expand karusse
appendEtymology(
	"nm_0177",
	"↳ From Slavic, compare Polish karaś (crucian carp)"
);

// nm_0200: Μαγιάτικο - expand Máios
appendEtymology(
	"nm_0200",
	"↳ From Latin Maius, named after goddess Maia"
);

// nm_0204: Greater weever - expand wivre
appendEtymology(
	"nm_0204",
	"↳ From Latin vipera (viper)"
);

// nm_0226: Kolyoz - FIX wrong derivation chain
// κολιός does NOT derive from σκόμβρος; they are different words
replaceInEtymology(
	"nm_0226",
	"↳ From Ancient Greek σκόμβρος skómbros",
	"↳ From Ancient Greek κολίας kolías (mackerel), possibly named after Cape Kolias in Attica"
);

// nm_0240: Tiriça - expand θρίσσα
appendEtymology(
	"nm_0240",
	"↳ Possibly from θρίξ thríx (hair), referring to many fine bones"
);

// nm_0241: Tirsi - expand θρίσσα
appendEtymology(
	"nm_0241",
	"↳ Possibly from θρίξ thríx (hair), referring to many fine bones"
);

// nm_0247: European anchovy - expand anchova
replaceInEtymology(
	"nm_0247",
	"anchovy: from Portuguese anchova",
	"anchovy: from Portuguese anchova\n↳ Possibly from Late Latin apiuva, from Greek ἀφύη aphýē (small fish); or from Basque antxoa (dried fish)"
);

// nm_0251: Torik - expand taríchion
appendEtymology(
	"nm_0251",
	"↳ Diminutive of τάριχος tárichos (preserved/dried fish)"
);

// nm_0277: Forell - expand Forelle
appendEtymology(
	"nm_0277",
	"↳ From Old High German forhana, from Proto-Germanic *furhna- (speckled), from PIE *perḱ- (spotted)"
);

// nm_0337: Dusky grouper - expand garoupa
appendEtymology(
	"nm_0337",
	"↳ garoupa origin uncertain, possibly from a South American indigenous language"
);

// nm_0340: Atlantic bluefin tuna - expand Arabic chain
appendEtymology(
	"nm_0340",
	"↳ From Latin thunnus, from Greek θύννος thýnnos (tuna), from θύνω thýnō (to rush)"
);

// nm_0341: John Dory - expand jaune doré
appendEtymology(
	"nm_0341",
	"↳ jaune from Latin galbinus (greenish-yellow), doré from Latin deauratus (gilded)"
);

// nm_0423: Simpukka - expand zhemchug chain
appendEtymology(
	"nm_0423",
	"↳ жемчуг from Turkic *yinčü (pearl), ultimately from Chinese 真珠 zhēnzhū (precious pearl)"
);

// nm_0424: Sinisimpukka - expand simpukka reference
replaceInEtymology(
	"nm_0424",
	"simpukka: mussel (from Russian жемчуг)",
	"simpukka: mussel (from Russian жемчуг zhemchug, pearl)"
);

// nm_0430: Common carp - expand carpe
appendEtymology(
	"nm_0430",
	"↳ From Medieval Latin carpa, from East Germanic (compare Gothic *karpa)"
);

// nm_0449: Red porgy - expand pargo
appendEtymology(
	"nm_0449",
	"↳ From Latin pagrus, from Greek φάγρος phágros (sea bream)"
);

// nm_0450: Uskumru - expand scomber
appendEtymology(
	"nm_0450",
	"↳ From Greek σκόμβρος skómbros (mackerel)"
);

// ============================================================
// PASS 5: Add missing borrowed_from relations
// ============================================================

console.log("\n--- Pass 5: Adding missing borrowed_from relations ---\n");

// Check existing relations to avoid duplicates
function relationExists(sourceId: string, targetId: string): boolean {
	const row = db
		.query(
			"SELECT 1 FROM name_relations WHERE source_id = ? AND target_id = ?"
		)
		.get(sourceId, targetId);
	return !!row;
}

// nm_0133 (Minekop) → nm_0135 (Μυλοκόπι): Turkish from Greek
if (!relationExists("nm_0133", "nm_0135")) {
	db.run(
		`INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, 'borrowed_from', ?)`,
		["nm_0133", "nm_0135", "Minekop from Greek Μυλοκόπι (mill-striker)"]
	);
	console.log("  OK: nm_0133 → nm_0135 (Minekop borrowed_from Μυλοκόπι)");
} else {
	console.log("  SKIP: nm_0133 → nm_0135 already exists");
}

// nm_0182 (Orfoz) → nm_0395 (ὀρφός): Turkish from Ancient Greek
if (!relationExists("nm_0182", "nm_0395")) {
	db.run(
		`INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, 'borrowed_from', ?)`,
		["nm_0182", "nm_0395", "Orfoz from Ancient Greek ὀρφός (grouper)"]
	);
	console.log("  OK: nm_0182 → nm_0395 (Orfoz borrowed_from ὀρφός)");
} else {
	console.log("  SKIP: nm_0182 → nm_0395 already exists");
}

// ============================================================
// Verification
// ============================================================

console.log("\n--- Verification ---\n");

// Spot-check a few expanded etymologies
const spotChecks = [
	"nm_0001",
	"nm_0020",
	"nm_0051",
	"nm_0226",
	"nm_0340",
	"nm_0423",
];
for (const id of spotChecks) {
	const row = db.query("SELECT name, etymology FROM names WHERE id = ?").get(id) as {
		name: string;
		etymology: string;
	} | null;
	if (row) {
		console.log(`${id} (${row.name}):`);
		console.log(`  ${row.etymology.replace(/\n/g, "\n  ")}`);
		console.log();
	}
}

// Check new relations
const newRels = db
	.query(
		`SELECT n1.name as source, r.relation, n2.name as target, r.notes
     FROM name_relations r
     JOIN names n1 ON r.source_id = n1.id
     JOIN names n2 ON r.target_id = n2.id
     WHERE (r.source_id = 'nm_0133' AND r.target_id = 'nm_0135')
        OR (r.source_id = 'nm_0182' AND r.target_id = 'nm_0395')`
	)
	.all() as { source: string; relation: string; target: string; notes: string }[];

console.log("New relations:");
for (const rel of newRels) {
	console.log(`  ${rel.source} → ${rel.relation} → ${rel.target}: ${rel.notes}`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
