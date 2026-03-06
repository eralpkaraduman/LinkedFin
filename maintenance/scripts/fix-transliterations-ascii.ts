/**
 * Fix transliterations to use only base ASCII Latin characters
 * Removes diacritics, macrons, and special characters
 */

import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Character replacements for transliteration normalization
const replacements: Record<string, string> = {
  // Accented vowels (Greek, etc.)
  'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'ÿ': 'y',

  // Macrons (Arabic scholarly transliteration)
  'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u',

  // Dots below (Arabic)
  'ḥ': 'h', 'ṣ': 's', 'ṭ': 't', 'ḍ': 'd', 'ẓ': 'z',

  // Arabic ayin and hamza
  'ʿ': '', 'ʾ': '', '\u2019': '',

  // Turkish specific
  'ı': 'i', 'İ': 'I',
  'ğ': 'gh', 'Ğ': 'Gh',
  'ş': 'sh', 'Ş': 'Sh',
  'ç': 'ch', 'Ç': 'Ch',

  // Nordic
  'ø': 'o', 'Ø': 'O',
  'å': 'a', 'Å': 'A',
  'æ': 'ae', 'Æ': 'Ae',

  // Ancient Greek special
  'ῆ': 'e', 'ῶ': 'o', 'ᾶ': 'a',

  // Circumflex (Ancient Greek)
  'ŷ': 'y', 'ê': 'e', 'ô': 'o', 'â': 'a', 'î': 'i', 'û': 'u',
};

function normalizeTransliteration(text: string): string {
  let result = text;

  // Apply character replacements
  for (const [from, to] of Object.entries(replacements)) {
    result = result.replaceAll(from, to);
  }

  // Handle any remaining non-ASCII by trying Unicode normalization
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return result;
}

function isValidTransliteration(text: string): boolean {
  // Only allow a-z, A-Z, 0-9, space, hyphen
  return /^[a-zA-Z0-9 \-]*$/.test(text);
}

// Get all records with transliterations
const records = db.query<{ id: string; transliteration: string; lang: string }, []>(
  "SELECT id, transliteration, lang FROM names WHERE transliteration IS NOT NULL AND transliteration != ''"
).all();

console.log(`Found ${records.length} records with transliterations`);

const updates: { id: string; old: string; new: string; lang: string }[] = [];

for (const record of records) {
  if (!isValidTransliteration(record.transliteration)) {
    const normalized = normalizeTransliteration(record.transliteration);

    if (normalized !== record.transliteration) {
      updates.push({
        id: record.id,
        old: record.transliteration,
        new: normalized,
        lang: record.lang,
      });
    }
  }
}

console.log(`\nFound ${updates.length} records needing updates:\n`);

// Group by language for review
const byLang = new Map<string, typeof updates>();
for (const u of updates) {
  if (!byLang.has(u.lang)) byLang.set(u.lang, []);
  byLang.get(u.lang)!.push(u);
}

for (const [lang, langUpdates] of byLang) {
  console.log(`\n=== ${lang} (${langUpdates.length} records) ===`);
  for (const u of langUpdates.slice(0, 5)) {
    console.log(`  ${u.id}: "${u.old}" → "${u.new}"`);
  }
  if (langUpdates.length > 5) {
    console.log(`  ... and ${langUpdates.length - 5} more`);
  }
}

// Ask for confirmation
console.log(`\n\nTotal: ${updates.length} records to update`);
console.log("Run with --apply to apply changes");

if (process.argv.includes("--apply")) {
  console.log("\nApplying updates...");

  const updateStmt = db.prepare(
    "UPDATE names SET transliteration = ? WHERE id = ?"
  );

  let count = 0;
  for (const u of updates) {
    updateStmt.run(u.new, u.id);
    count++;
  }

  console.log(`Updated ${count} records`);

  // Verify no invalid transliterations remain
  const remaining = db.query<{ count: number }, []>(
    "SELECT COUNT(*) as count FROM names WHERE transliteration IS NOT NULL AND transliteration != '' AND transliteration GLOB '*[^a-zA-Z0-9 -]*'"
  ).get();

  if (remaining && remaining.count > 0) {
    console.log(`\nWarning: ${remaining.count} records still have non-ASCII characters`);
  } else {
    console.log("\nAll transliterations are now valid ASCII");
  }
}
