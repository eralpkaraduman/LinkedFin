import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Fix Arabic transliterations - add proper vowels
const arabicFixes: { id: string; transliteration: string }[] = [
  { id: "nm_0003", transliteration: "Dintiks kabīr al-ʿayn" },
  { id: "nm_0008", transliteration: "Dintiks" },
  { id: "nm_0012", transliteration: "Dinnīs aswad" },
  { id: "nm_0016", transliteration: "Barbūn" },
  { id: "nm_0017", transliteration: "Sulṭān Ibrāhīm" },
  { id: "nm_0025", transliteration: "Samak azraq" },
  { id: "nm_0034", transliteration: "Dinnīs" },
  { id: "nm_0038", transliteration: "Waqqār" },
  { id: "nm_0042", transliteration: "Salba" },
  { id: "nm_0046", transliteration: "Samak Mūsā" },
  { id: "nm_0050", transliteration: "Marjān" },
  { id: "nm_0054", transliteration: "Marjān ṣaghīr" },
  { id: "nm_0058", transliteration: "Būrī" },
  { id: "nm_0062", transliteration: "Sulṭān Ibrāhīm" },
  { id: "nm_0063", transliteration: "Barbūn mukhaṭṭaṭ" },
  { id: "nm_0067", transliteration: "Balāmīṭa" },
  { id: "nm_0071", transliteration: "Salmūn" },
  { id: "nm_0076", transliteration: "Sharghu" },
  { id: "nm_0080", transliteration: "Ṣawrīl" },
  { id: "nm_0084", transliteration: "Thuʿbān al-baḥr" },
  { id: "nm_0085", transliteration: "Anqalīs" },
  { id: "nm_0089", transliteration: "Shafnīn" },
  { id: "nm_0093", transliteration: "Karkand" },
  { id: "nm_0094", transliteration: "Jarād al-baḥr" },
  { id: "nm_0098", transliteration: "Ukhṭubūṭ" },
  { id: "nm_0102", transliteration: "Gambarī" },
  { id: "nm_0103", transliteration: "Quraydis" },
  { id: "nm_0107", transliteration: "Sulṭaʿūn azraq" },
  { id: "nm_0111", transliteration: "Sulṭaʿūn" },
  { id: "nm_0112", transliteration: "Kābūryā" },
  { id: "nm_0116", transliteration: "Jarād al-nahr" },
  { id: "nm_0120", transliteration: "Ḥabbār" },
  { id: "nm_0121", transliteration: "Kalamārī" },
  { id: "nm_0125", transliteration: "Ḥabbār" },
  { id: "nm_0126", transliteration: "Sabbīṭ" },
  { id: "nm_0130", transliteration: "Sardīn" },
  { id: "nm_0136", transliteration: "Ghurāb" },
  { id: "nm_0185", transliteration: "Qārūṣ" },
];

// Fix Greek transliterations - consistent accents and μπ/ου handling
const greekFixes: { id: string; transliteration: string }[] = [
  { id: "nm_0002", transliteration: "Synagrída megalófthalmi" },
  { id: "nm_0007", transliteration: "Synagrída" },
  { id: "nm_0011", transliteration: "Skathári" },
  { id: "nm_0015", transliteration: "Barboúni" },
  { id: "nm_0024", transliteration: "Gofári" },
  { id: "nm_0033", transliteration: "Tsipoúra" },
  { id: "nm_0037", transliteration: "Sfyría" },
  { id: "nm_0041", transliteration: "Sálpa" },
  { id: "nm_0045", transliteration: "Glóssa" },
  { id: "nm_0049", transliteration: "Lythríni" },
  { id: "nm_0053", transliteration: "Mousmoúli" },
  { id: "nm_0057", transliteration: "Kéfalos" },
  { id: "nm_0061", transliteration: "Koutsomoúra" },
  { id: "nm_0066", transliteration: "Palamída" },
  { id: "nm_0070", transliteration: "Solomós" },
  { id: "nm_0075", transliteration: "Spáros" },
  { id: "nm_0079", transliteration: "Savrídi" },
  { id: "nm_0083", transliteration: "Chéli" },
  { id: "nm_0088", transliteration: "Vátos" },
  { id: "nm_0092", transliteration: "Astakós" },
  { id: "nm_0097", transliteration: "Chtapódi" },
  { id: "nm_0101", transliteration: "Garída" },
  { id: "nm_0106", transliteration: "Ble kavoúri" },
  { id: "nm_0110", transliteration: "Kavoúri" },
  { id: "nm_0115", transliteration: "Karavída" },
  { id: "nm_0119", transliteration: "Kalamári" },
  { id: "nm_0124", transliteration: "Soupiá" },
  { id: "nm_0129", transliteration: "Sardéla" },
  { id: "nm_0135", transliteration: "Mylokópi" },
  { id: "nm_0139", transliteration: "Melanoúri" },
  { id: "nm_0184", transliteration: "Lavráki" },
  { id: "nm_0191", transliteration: "Fangrí" },
  { id: "nm_0194", transliteration: "Sargós" },
  { id: "nm_0197", transliteration: "Melanoúri" },
  { id: "nm_0200", transliteration: "Mayátiko" },
  { id: "nm_0203", transliteration: "Drákaina" },
  { id: "nm_0227", transliteration: "Koliós" },
  { id: "nm_0231", transliteration: "Kalkáni" },
  { id: "nm_0235", transliteration: "Zargána" },
  { id: "nm_0239", transliteration: "Bakaliáros" },
  { id: "nm_0246", transliteration: "Gávros" },
  { id: "nm_0262", transliteration: "Skorpína" },
];

const update = db.prepare("UPDATE names SET transliteration = ? WHERE id = ?");

let fixed = 0;

console.log("Fixing Arabic transliterations...");
for (const fix of arabicFixes) {
  update.run(fix.transliteration, fix.id);
  console.log(`✓ ${fix.id}: ${fix.transliteration}`);
  fixed++;
}

console.log("\nFixing Greek transliterations...");
for (const fix of greekFixes) {
  update.run(fix.transliteration, fix.id);
  console.log(`✓ ${fix.id}: ${fix.transliteration}`);
  fixed++;
}

console.log(`\nFixed ${fixed} transliterations.`);
db.close();
