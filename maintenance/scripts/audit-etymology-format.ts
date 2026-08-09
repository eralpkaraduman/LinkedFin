/**
 * Etymology Format Audit (TREK-542)
 *
 * Scripted batch replacement for EPIC-6's one-task-per-record audit.
 * Checks `names.etymology` / `transliteration` / `phonetic` against the
 * "Etymology Format Standard" section of AGENTS.md:
 *
 *   1. Basic:              From [language] word (meaning)
 *   2. Compound:           "Compound: part1 + part2" with the parts glossed
 *                          on the following line(s)
 *   3. Derivation chains:  "↳" starts its own line
 *   4. No equals signs, no quotes around meanings
 *   5. Transliteration present for non-Latin scripts, and non-Latin words
 *      quoted inside an etymology carry a romanization
 *
 * This reports only. Fixes are applied by fix-etymology-format-since-epic6.ts.
 *
 * Usage:
 *   pnpm tsx maintenance/scripts/audit-etymology-format.ts             # all names
 *   pnpm tsx maintenance/scripts/audit-etymology-format.ts --unaudited # TREK-542 set
 *   pnpm tsx maintenance/scripts/audit-etymology-format.ts --ids nm_0428,nm_0429
 *
 * Exit code is always 0 — this is a report, not a gate. `pnpm db:validate`
 * remains the deploy gate.
 */
import Database from "better-sqlite3";

/**
 * The 109 names that EPIC-6 never audited.
 *
 * Derived, not assumed: every completed EPIC-6 child task is titled
 * "[nm_XXXX] <name> - etymology audit", so the audited set is the 403 IDs
 * parsed out of those titles. This list is `SELECT id FROM names` minus that
 * set. Note it is NOT a clean range — it is nm_0428..nm_0505 plus
 * nm_0525..nm_0555 (nm_0506..nm_0524 were never allocated).
 */
export const UNAUDITED_SINCE_EPIC6: readonly string[] = [
	...Array.from({ length: 78 }, (_, i) => `nm_${String(428 + i).padStart(4, "0")}`),
	...Array.from({ length: 31 }, (_, i) => `nm_${String(525 + i).padStart(4, "0")}`),
];

interface NameRow {
	id: string;
	name: string;
	lang: string;
	region_id: string;
	etymology: string;
	transliteration: string;
	phonetic: string;
}

export interface Finding {
	id: string;
	rule: string;
	detail: string;
}

const PHONETIC_PATTERN = /^(\/[^/]+\/|\[[^\]]+\])$/;

/** Scripts that need a romanization alongside the native spelling. */
const NON_LATIN = /[Ͱ-ϿЀ-ӿ֐-׿؀-ۿऀ-ॿ぀-ヿ一-鿿가-힯]/;

/** Latin letters, so we can tell "has a romanization next to it" apart from "doesn't". */
const LATIN = /[A-Za-z]/;

/**
 * "From <language> <word>" lines must gloss the word. Anchored on an explicit
 * language/period name so descriptive lines ("From the legend that ...") do not
 * trip the check.
 *
 * Prefixes are chainable (zero or more, TREK-571) so two-word periods like
 * "Old High German" or "Middle Low German" are recognised, not just a single
 * modifier immediately before the base language name. The prefix and base
 * lists were derived empirically from every "From X" / "Borrowed from X" /
 * "Via X" clause in the corpus (see TREK-571 for the full diff against what
 * was recognised before).
 */
const LANG_PREFIX =
	"(?:Ancient|Middle|Old|Modern|Proto-|Vulgar|Medieval|Late|Low|High|Byzantine|Standard|Koine|Hellenistic|Ottoman|Egyptian|Anglo)";
const LANG_BASE =
	"(?:Greek|Latin|Norse|Dutch|German|English|French|Occitan|Italian|Ligurian|Venetian|Spanish|Portuguese|Persian|Arabic|Turkish|Swedish|Danish|Norwegian|Finnish|Estonian|Sami|Polish|Slavic|Germanic|Finnic|Frankish|Saxon|Celtic|Irish|Tupi|Basque|Indo-European|Finno-Ugric|Romance|Provençal|Russian|Coptic|Aramaic|Uralic|Laz)";
const FROM_LINE = new RegExp(
	`^(?:↳\\s*)?(?:From|from|Calque from|Borrowed from|Inherited from|Via|via)\\s+((?:${LANG_PREFIX}[- ]?)*${LANG_BASE}\\b.*)$`,
);

/**
 * `names.lang` -> the language name(s) a "From <language> ..." clause uses
 * to name that same language. `grc` records are written either
 * "From Ancient Greek ..." or, occasionally, plain "From Greek ..." — both
 * refer to the record's own language.
 */
const OWN_LANGUAGE_NAMES: Record<string, string[]> = {
	tur: ["Turkish"],
	ell: ["Greek"],
	eng: ["English"],
	swe: ["Swedish"],
	fin: ["Finnish"],
	ita: ["Italian"],
	fra: ["French"],
	arb: ["Arabic"],
	arz: ["Arabic"],
	apc: ["Arabic"],
	est: ["Estonian"],
	grc: ["Ancient Greek", "Greek"],
	deu: ["German"],
	nld: ["Dutch"],
	nor: ["Norwegian"],
	spa: ["Spanish"],
	dan: ["Danish"],
	pol: ["Polish"],
	fas: ["Persian"],
	sme: ["Sami"],
	vec: ["Venetian"],
};

/**
 * Fish/creature vocabulary (TREK-567). When the gloss on a same-language
 * "From X ..." line is one of these, the etymology restates the headword
 * instead of explaining it — a dead end, not a derivation. Matched as a
 * case-insensitive substring so compounds like "dreamfish" or "cod-like
 * fish" are caught via "fish".
 */
const FISH_GLOSS_WORDS = [
	"fish",
	"sea bream",
	"seabream",
	"bream",
	"mackerel",
	"ray",
	"skate",
	"lobster",
	"crayfish",
	"shrimp",
	"prawn",
	"mullet",
	"bass",
	"tuna",
	"bonito",
	"anchovy",
	"sardine",
	"pilchard",
	"crab",
	"squid",
	"cuttlefish",
	"octopus",
	"eel",
	"sole",
	"perch",
	"carp",
	"trout",
	"salmon",
	"herring",
	"whitefish",
	"pike",
	"grouper",
	"dentex",
	"scorpionfish",
	"goby",
	"shad",
	"sprat",
	"turbot",
	"flounder",
	"halibut",
	"crustacean",
	"mollusc",
	"mollusk",
	"bivalve",
	"oyster",
	"mussel",
];

/** Matches any FISH_GLOSS_WORDS entry as a substring, case-insensitively. */
const FISH_GLOSS_PATTERN = new RegExp(
	FISH_GLOSS_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
	"i",
);

export function auditName(row: NameRow): Finding[] {
	const findings: Finding[] = [];
	const add = (rule: string, detail: string) => findings.push({ id: row.id, rule, detail });

	const ety = row.etymology ?? "";
	const lines = ety.split("\n");

	// --- required fields (mirrors validate-integrity.ts, kept here so the audit
	// report is self-contained) ---
	if (ety.trim() === "") add("empty-etymology", "etymology is empty");
	if ((row.transliteration ?? "").trim() === "") add("empty-transliteration", "transliteration is empty");
	if ((row.phonetic ?? "").trim() === "") add("empty-phonetic", "phonetic is empty");
	else if (!PHONETIC_PATTERN.test(row.phonetic))
		add("phonetic-delimiters", `phonetic ${JSON.stringify(row.phonetic)} is not /slashes/ or [brackets]`);

	// Latin-script names romanize to plain ASCII (AGENTS.md folding tables); this
	// is the convention across every record EPIC-6 audited.
	if (!NON_LATIN.test(row.name) && ![...row.transliteration].every((c) => c.charCodeAt(0) < 128))
		add("non-ascii-transliteration", `transliteration "${row.transliteration}" keeps diacritics`);

	// IPA primary stress is U+02C8, not an ASCII apostrophe.
	if (row.phonetic.includes("'"))
		add("ascii-stress-mark", `phonetic ${row.phonetic} uses ' instead of ˈ`);

	// --- rule 4: no equals signs ---
	if (ety.includes("=")) add("equals-sign", `etymology uses "=": ${firstLineWith(lines, "=")}`);

	// --- rule 4: no quotes around meanings ---
	const quoted = ety.match(/["“”'‘’][^"“”'‘’\n]{2,}["“”'‘’]/);
	if (quoted) add("quoted-meaning", `quoted gloss ${quoted[0]}`);

	// --- rule 3: ↳ must start its own line ---
	for (const line of lines) {
		const at = line.indexOf("↳");
		if (at > 0) add("inline-arrow", `"↳" mid-line: ${line.trim()}`);
	}

	// --- formatting hygiene ---
	if (ety !== ety.trim()) add("whitespace", "leading/trailing whitespace in etymology");
	if (/\n{2,}/.test(ety)) add("whitespace", "blank line inside etymology");
	if (lines.some((l) => l !== l.trimEnd())) add("whitespace", "trailing whitespace on a line");

	// --- rule 2: compound format ---
	// Matches a leading "↳ " too (TREK-571) — a compound introduced under an
	// arrow, mid-derivation, was previously invisible to this check entirely.
	const compoundIdx = lines.findIndex((l) => /^(?:↳\s*)?Compound:/.test(l.trim()));
	if (compoundIdx !== -1) {
		const head = lines[compoundIdx].trim();
		if (!head.includes("+")) add("compound-head", `"Compound:" line has no "+": ${head}`);
		const parts = head
			.replace(/^(?:↳\s*)?Compound:\s*/, "")
			.split("+")
			.map((p) => p.trim())
			.filter(Boolean);
		const gloss = lines.slice(compoundIdx + 1).join("\n");
		if (gloss.trim() === "") add("compound-gloss", `"${head}" has no gloss line`);
		else {
			for (const part of parts) {
				const bare = part.split(/\s+/)[0];
				if (!gloss.includes(bare)) add("compound-gloss", `part "${part}" not glossed under: ${head}`);
			}
		}
	} else if (/^\s*\S+\s*\+\s*\S+/.test(lines[0] ?? "") && !/^(From|Calque)/.test(lines[0] ?? "")) {
		add("compound-head", `looks compound but no "Compound:" prefix: ${lines[0]}`);
	}

	// --- rule 1: every "From X ..." clause glosses its word ---
	for (const raw of lines) {
		const line = raw.trim();
		const m = line.match(FROM_LINE);
		if (!m) continue;
		if (!/\(/.test(line) && !/(origin uncertain|unknown|uncertain)/i.test(line)) {
			add("missing-gloss", `no (meaning) on: ${line}`);
		}
	}

	// --- circular etymology: same-language etymon with a fish/creature gloss
	// and no ↳ continuation (TREK-567). The naive "same-language etymon" test
	// alone is wrong — plenty of good semantic etymologies name a fish after
	// an ordinary word (e.g. "From Turkish yaprak (leaf)"). The discriminator
	// is whether the gloss itself just names a fish/creature: that restates
	// the headword instead of explaining it.
	{
		const ownNames = OWN_LANGUAGE_NAMES[row.lang];
		const first = (lines[0] ?? "").trim();
		if (ownNames && !ety.includes("↳")) {
			const langAlt = ownNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
			const ownLangFromLine = new RegExp(`^(?:From|Borrowed from|Via)\\s+(?:${langAlt})\\b`);
			if (ownLangFromLine.test(first)) {
				const glossMatch = first.match(/\(([^)]*)\)/);
				if (glossMatch && FISH_GLOSS_PATTERN.test(glossMatch[1]))
					add("circular-etymology", `gloss just names a fish/creature: ${first}`);
			}
		}
	}

	// --- rule 5: transliteration for non-Latin scripts ---
	if (NON_LATIN.test(row.name)) {
		if (!LATIN.test(row.transliteration))
			add("missing-transliteration", `non-Latin name "${row.name}" has no romanized transliteration`);
		if (row.transliteration.trim() === row.name.trim())
			add("missing-transliteration", `transliteration repeats the non-Latin name "${row.name}"`);
	}

	// A non-Latin word inside the etymology needs a romanization on the same line.
	for (const raw of lines) {
		const line = raw.trim();
		if (!NON_LATIN.test(line)) continue;
		const stripped = line.replace(/\(.*?\)/g, "");
		if (!LATIN.test(stripped.replace(/^(?:↳\s*)?(?:From|Calque from|Borrowed from|Via)\s*/i, "")))
			add("missing-translit-in-etymology", `non-Latin word without romanization: ${line}`);
	}

	return findings;
}

function firstLineWith(lines: string[], needle: string): string {
	return (lines.find((l) => l.includes(needle)) ?? "").trim();
}

function main() {
	const argv = process.argv.slice(2);
	const db = new Database("public/fish.db", { readonly: true });

	let ids: string[] | null = null;
	if (argv.includes("--unaudited")) ids = [...UNAUDITED_SINCE_EPIC6];
	const idsFlag = argv.indexOf("--ids");
	if (idsFlag !== -1 && argv[idsFlag + 1]) ids = argv[idsFlag + 1].split(",").map((s) => s.trim());

	const all = db
		.prepare(
			"SELECT id, name, lang, region_id, etymology, transliteration, phonetic FROM names ORDER BY id",
		)
		.all() as NameRow[];
	const rows = ids ? all.filter((r) => ids.includes(r.id)) : all;

	if (ids) {
		const missing = ids.filter((id) => !all.some((r) => r.id === id));
		if (missing.length) console.log(`WARNING: ids not in database: ${missing.join(", ")}\n`);
	}

	const findings: Finding[] = [];
	for (const row of rows) findings.push(...auditName(row));

	const byId = new Map<string, Finding[]>();
	for (const f of findings) {
		const list = byId.get(f.id) ?? [];
		list.push(f);
		byId.set(f.id, list);
	}

	console.log(`=== Etymology format audit: ${rows.length} records ===\n`);
	for (const row of rows) {
		const list = byId.get(row.id);
		if (!list) continue;
		console.log(`${row.id} (${row.lang}) ${row.name}`);
		console.log(`  etymology: ${JSON.stringify(row.etymology)}`);
		for (const f of list) console.log(`  ✗ [${f.rule}] ${f.detail}`);
		console.log("");
	}

	const byRule = new Map<string, number>();
	for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);

	console.log("--- Summary ---");
	console.log(`compliant:     ${rows.length - byId.size}`);
	console.log(`non-compliant: ${byId.size}`);
	for (const [rule, n] of [...byRule].sort((a, b) => b[1] - a[1])) console.log(`  ${rule}: ${n}`);

	db.close();
}

if (process.argv[1]?.endsWith("audit-etymology-format.ts")) main();
