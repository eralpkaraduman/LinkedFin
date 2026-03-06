import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Finnish transliterations: ä→a, ö→o
const finnishFixes: { id: string; transliteration: string }[] = [
  { id: "nm_0140", transliteration: "Lohi" },
  { id: "nm_0141", transliteration: "Ahven" },
  { id: "nm_0142", transliteration: "Hauki" },
  { id: "nm_0143", transliteration: "Kuha" },
  { id: "nm_0144", transliteration: "Taimen" },
  { id: "nm_0145", transliteration: "Siika" },
  { id: "nm_0146", transliteration: "Muikku" },
  { id: "nm_0147", transliteration: "Made" },
  { id: "nm_0148", transliteration: "Lahna" },
  { id: "nm_0149", transliteration: "Sarki" },      // Särki
  { id: "nm_0150", transliteration: "Kuore" },
  { id: "nm_0151", transliteration: "Silakka" },
  { id: "nm_0152", transliteration: "Kiiski" },
  { id: "nm_0153", transliteration: "Sorva" },
  { id: "nm_0154", transliteration: "Salakka" },
  { id: "nm_0155", transliteration: "Sayne" },      // Säyne
  { id: "nm_0156", transliteration: "Pasuri" },
  { id: "nm_0157", transliteration: "Ruutana" },
  { id: "nm_0158", transliteration: "Suutari" },
  { id: "nm_0159", transliteration: "Kolmipiikki" },
  { id: "nm_0180", transliteration: "Kirjolohi" },
  { id: "nm_0264", transliteration: "Norssi" },
  { id: "nm_0265", transliteration: "Kurvi" },
  { id: "nm_0266", transliteration: "Siniainen" },  // Siniäinen
  { id: "nm_0267", transliteration: "Silli" },
];

// Swedish transliterations: å→a, ä→a, ö→o
const swedishFixes: { id: string; transliteration: string }[] = [
  { id: "nm_0205", transliteration: "Abborre" },
  { id: "nm_0206", transliteration: "Gadda" },      // Gädda
  { id: "nm_0207", transliteration: "Gos" },        // Gös
  { id: "nm_0208", transliteration: "Lax" },
  { id: "nm_0209", transliteration: "Oring" },      // Öring
  { id: "nm_0210", transliteration: "Sik" },
  { id: "nm_0211", transliteration: "Sikloja" },    // Siklöja
  { id: "nm_0212", transliteration: "Lake" },
  { id: "nm_0213", transliteration: "Braxen" },
  { id: "nm_0214", transliteration: "Mort" },       // Mört
  { id: "nm_0215", transliteration: "Nors" },
  { id: "nm_0216", transliteration: "Stromming" },  // Strömming
  { id: "nm_0217", transliteration: "Gars" },       // Gärs
  { id: "nm_0218", transliteration: "Sarv" },
  { id: "nm_0219", transliteration: "Loja" },       // Löja
  { id: "nm_0220", transliteration: "Id" },
  { id: "nm_0221", transliteration: "Bjorkna" },    // Björkna
  { id: "nm_0222", transliteration: "Ruda" },
  { id: "nm_0223", transliteration: "Sutare" },
  { id: "nm_0224", transliteration: "Storspigg" },
  { id: "nm_0225", transliteration: "Regnbage" },   // Regnbåge
  // Duplicate Swedish entries (Finland-Swedish region)
  { id: "nm_0287", transliteration: "Abborre" },
  { id: "nm_0288", transliteration: "Gadda" },
  { id: "nm_0289", transliteration: "Gos" },
  { id: "nm_0290", transliteration: "Lax" },
  { id: "nm_0291", transliteration: "Oring" },
  { id: "nm_0292", transliteration: "Sik" },
  { id: "nm_0293", transliteration: "Mujka" },
  { id: "nm_0294", transliteration: "Lake" },
  { id: "nm_0295", transliteration: "Braxen" },
  { id: "nm_0296", transliteration: "Mort" },
  { id: "nm_0297", transliteration: "Nors" },
  { id: "nm_0298", transliteration: "Stromming" },
  { id: "nm_0299", transliteration: "Gers" },
  { id: "nm_0300", transliteration: "Sarv" },
  { id: "nm_0301", transliteration: "Loja" },
  { id: "nm_0302", transliteration: "Id" },
  { id: "nm_0303", transliteration: "Bjorkna" },
  { id: "nm_0304", transliteration: "Ruda" },
  { id: "nm_0305", transliteration: "Sutare" },
  { id: "nm_0306", transliteration: "Storspigg" },
  { id: "nm_0307", transliteration: "Regnbage" },
];

// Estonian transliterations: õ→o, ä→a, ö→o, ü→u
const estonianFixes: { id: string; transliteration: string }[] = [
  { id: "nm_0268", transliteration: "Ahven" },
  { id: "nm_0269", transliteration: "Haug" },
  { id: "nm_0270", transliteration: "Koha" },
  { id: "nm_0271", transliteration: "Lohi" },       // Lõhi
  { id: "nm_0272", transliteration: "Siig" },
  { id: "nm_0273", transliteration: "Made" },
  { id: "nm_0274", transliteration: "Latikas" },
  { id: "nm_0275", transliteration: "Sarg" },       // Särg
  { id: "nm_0276", transliteration: "Raim" },       // Räim
  { id: "nm_0277", transliteration: "Forell" },
  { id: "nm_0278", transliteration: "Kiisk" },
  { id: "nm_0279", transliteration: "Linask" },
  { id: "nm_0280", transliteration: "Koger" },
  { id: "nm_0281", transliteration: "Vikerforell" },
];

const update = db.prepare("UPDATE names SET transliteration = ? WHERE id = ?");

let fixed = 0;

console.log("Adding Finnish transliterations...");
for (const fix of finnishFixes) {
  update.run(fix.transliteration, fix.id);
  console.log(`✓ ${fix.id}: ${fix.transliteration}`);
  fixed++;
}

console.log("\nAdding Swedish transliterations...");
for (const fix of swedishFixes) {
  update.run(fix.transliteration, fix.id);
  console.log(`✓ ${fix.id}: ${fix.transliteration}`);
  fixed++;
}

console.log("\nAdding Estonian transliterations...");
for (const fix of estonianFixes) {
  update.run(fix.transliteration, fix.id);
  console.log(`✓ ${fix.id}: ${fix.transliteration}`);
  fixed++;
}

console.log(`\nAdded ${fixed} transliterations.`);
db.close();
