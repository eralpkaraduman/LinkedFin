import { Database } from "bun:sqlite";

const db = new Database("fish.db");

const names = db.query(`
  SELECT id, name, lang, etymology FROM names WHERE etymology IS NOT NULL
`).all() as { id: string; name: string; lang: string; etymology: string }[];

const langNames: Record<string, string> = {
  tur: "Turkish",
  ell: "Greek",
  ara: "Arabic",
  eng: "English",
  lat: "Latin",
};

function reformatEtymology(etym: string, lang: string): string {
  const origLang = langNames[lang] || lang;

  // Already in good format
  if (etym.startsWith("From ")) {
    return etym;
  }

  // "Unknown origin" - keep as is
  if (etym.toLowerCase().includes("unknown")) {
    return etym;
  }

  // "Descriptive - refers to X"
  if (etym.toLowerCase().startsWith("descriptive")) {
    const match = etym.match(/refers to (.+)/i);
    if (match) {
      return `Descriptive English term referring to ${match[1]}`;
    }
    return etym;
  }

  // "Native Turkish X (meaning) + Y (meaning)"
  if (etym.toLowerCase().startsWith("native")) {
    const match = etym.match(/native (\w+)\s+(.+)/i);
    if (match) {
      return `From ${match[1]} ${match[2]}`;
    }
  }

  // "word - from Language X (meaning)"
  const fromMatch = etym.match(/^.+\s*-\s*from\s+(\w+)\s+(.+)/i);
  if (fromMatch) {
    return `From ${fromMatch[1]} ${fromMatch[2]}`;
  }

  // "X (meaning) + Y (meaning)" compound words
  if (etym.includes("+") && etym.includes("(")) {
    return `From ${origLang}: ${etym}`;
  }

  // "word = meaning" format (Greek/Arabic)
  const eqMatch = etym.match(/^([^=]+)\s*=\s*(.+)$/);
  if (eqMatch) {
    const word = eqMatch[1].trim();
    const meaning = eqMatch[2].trim();
    return `From ${origLang} "${word}" meaning "${meaning}"`;
  }

  // "word - description"
  const dashMatch = etym.match(/^([^-]+)\s*-\s*(.+)$/);
  if (dashMatch) {
    const word = dashMatch[1].trim();
    const rest = dashMatch[2].trim();

    // Check if rest mentions another language origin
    if (rest.toLowerCase().includes("from") || rest.toLowerCase().includes("ancient")) {
      return `From ${origLang} "${word}": ${rest}`;
    }
    return `From ${origLang} "${word}" meaning "${rest}"`;
  }

  // "Alternate spelling of X"
  if (etym.toLowerCase().includes("alternate spelling")) {
    return etym;
  }

  // Default: wrap as-is with language context
  return `From ${origLang}: ${etym}`;
}

console.log("Reformatting etymologies...\n");

const update = db.prepare("UPDATE names SET etymology = ? WHERE id = ?");
let changed = 0;

for (const { id, name, lang, etymology } of names) {
  const newEtym = reformatEtymology(etymology, lang);

  if (newEtym !== etymology) {
    console.log(`${name}:`);
    console.log(`  OLD: ${etymology}`);
    console.log(`  NEW: ${newEtym}`);
    console.log();
    update.run(newEtym, id);
    changed++;
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Done! ${changed} etymologies reformatted.`);

db.close();
