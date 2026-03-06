import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Get all names with their language (ISO 639-3)
const names = db.query(`
  SELECT id, name, lang FROM names
`).all() as { id: string; name: string; lang: string }[];

console.log(`Processing ${names.length} names...\n`);

// Wiktionary API query - uses the action API to get wikitext
async function queryWiktionary(word: string, lang: string): Promise<string | null> {
  // ISO 639-3 to Wiktionary language code (ISO 639-1)
  const langCode = {
    tur: "tr",
    ell: "el",
    ara: "ar",
    eng: "en",
    lat: "la",
  }[lang] || "en";

  try {
    // English Wiktionary has the most coverage
    const url = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=revisions&rvprop=content&format=json&rvslots=main`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LinkedFin/1.0 (fish etymology database)" }
    });

    if (!res.ok) return null;

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    if (pageId === "-1") return null; // Page doesn't exist

    const content = pages[pageId]?.revisions?.[0]?.slots?.main?.["*"];
    if (!content) return null;

    // Look for IPA template: {{IPA|xx|/.../ or {{IPA|/.../
    // Common formats: {{IPA|en|/ˈbluːfɪʃ/}}, {{IPA|tr|/lyˈfeɾ/}}
    const ipaMatch = content.match(/\{\{IPA\|[^|]*\|\/([^\/}]+)\/\}\}/i)
      || content.match(/\{\{IPA\|\/([^\/}]+)\/\}\}/i)
      || content.match(/\[\[([ˈˌ]?[a-zɐɑɒæəɛɜɪɨʊʉɔœøʌʏ][ˈˌːa-zɐɑɒæəɛɜɪɨʊʉɔœøʌʏˈˌːʔβçðɣʝɫɲŋɾʃʒθχʁɹɻʋʍɥ\.]+)\]\]/i);

    if (ipaMatch && ipaMatch[1]) {
      const ipa = ipaMatch[1].trim();
      // Validate it looks like IPA (has IPA-specific characters)
      if (ipa.length > 1 && /[ˈˌːɐɑɒæəɛɜɪɨʊʉɔœøʌʏʔβçðɣʝɫɲŋɾʃʒθχʁɹɻʋɥ]/.test(ipa)) {
        return `/${ipa}/`;
      }
    }
  } catch (e) {
    // Silently fail, will use fallback
  }
  return null;
}

// Turkish IPA rules (highly regular orthography)
function turkishToIPA(word: string): string {
  const map: Record<string, string> = {
    a: "a", e: "e", ı: "ɯ", i: "i", o: "o", ö: "œ", u: "u", ü: "y",
    b: "b", c: "dʒ", ç: "tʃ", d: "d", f: "f", g: "ɡ", ğ: "ː", // ğ lengthens preceding vowel
    h: "h", j: "ʒ", k: "k", l: "l", m: "m", n: "n", p: "p", r: "ɾ",
    s: "s", ş: "ʃ", t: "t", v: "v", y: "j", z: "z",
  };

  let ipa = "";
  const lower = word.toLowerCase();

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (map[char] !== undefined) {
      // Handle ğ - it lengthens the previous vowel rather than being pronounced
      if (char === "ğ" && ipa.length > 0) {
        ipa += "ː";
      } else if (char !== "ğ") {
        ipa += map[char];
      }
    } else if (char === " ") {
      ipa += " ";
    }
  }

  // Add stress mark on first syllable (simplified - Turkish stress is complex)
  if (ipa.length > 0 && !ipa.startsWith("ˈ")) {
    ipa = "ˈ" + ipa;
  }

  return `/${ipa}/`;
}

// Greek IPA rules
function greekToIPA(word: string): string {
  const map: Record<string, string> = {
    α: "a", ά: "ˈa", β: "v", γ: "ɣ", δ: "ð", ε: "e", έ: "ˈe",
    ζ: "z", η: "i", ή: "ˈi", θ: "θ", ι: "i", ί: "ˈi", κ: "k",
    λ: "l", μ: "m", ν: "n", ξ: "ks", ο: "o", ό: "ˈo", π: "p",
    ρ: "r", σ: "s", ς: "s", τ: "t", υ: "i", ύ: "ˈi", φ: "f",
    χ: "x", ψ: "ps", ω: "o", ώ: "ˈo",
  };

  let ipa = "";
  const lower = word.toLowerCase();

  // Handle digraphs first
  let processed = lower
    .replace(/μπ/g, "b")
    .replace(/ντ/g, "d")
    .replace(/γκ/g, "ɡ")
    .replace(/γγ/g, "ŋɡ")
    .replace(/τσ/g, "ts")
    .replace(/τζ/g, "dz")
    .replace(/ου/g, "u")
    .replace(/οू/g, "ˈu")
    .replace(/αι/g, "e")
    .replace(/ει/g, "i")
    .replace(/οι/g, "i")
    .replace(/αυ/g, "av")
    .replace(/ευ/g, "ev");

  for (const char of processed) {
    if (map[char] !== undefined) {
      ipa += map[char];
    } else if (/[a-z]/.test(char)) {
      ipa += char; // Already converted digraph
    } else if (char === " ") {
      ipa += " ";
    }
  }

  // Clean up multiple stress marks, keep only first
  const stressCount = (ipa.match(/ˈ/g) || []).length;
  if (stressCount > 1) {
    let first = true;
    ipa = ipa.replace(/ˈ/g, () => {
      if (first) { first = false; return "ˈ"; }
      return "";
    });
  }

  if (!ipa.includes("ˈ") && ipa.length > 0) {
    ipa = "ˈ" + ipa;
  }

  return `/${ipa}/`;
}

// Arabic IPA rules (simplified - Arabic phonology is complex)
function arabicToIPA(word: string): string {
  const map = new Map<string, string>([
    ["ا", "aː"], ["أ", "ʔa"], ["إ", "ʔi"], ["آ", "ʔaː"], ["ب", "b"], ["ت", "t"], ["ث", "θ"],
    ["ج", "dʒ"], ["ح", "ħ"], ["خ", "x"], ["د", "d"], ["ذ", "ð"], ["ر", "r"], ["ز", "z"],
    ["س", "s"], ["ش", "ʃ"], ["ص", "sˤ"], ["ض", "dˤ"], ["ط", "tˤ"], ["ظ", "ðˤ"],
    ["ع", "ʕ"], ["غ", "ɣ"], ["ف", "f"], ["ق", "q"], ["ك", "k"], ["ل", "l"], ["م", "m"],
    ["ن", "n"], ["ه", "h"], ["و", "w"], ["ي", "j"], ["ى", "aː"], ["ة", "a"],
    ["\u064E", "a"], ["\u0650", "i"], ["\u064F", "u"], // fatha, kasra, damma
    ["\u064B", "an"], ["\u064D", "in"], ["\u064C", "un"], // tanwin
    ["\u0651", "ː"], // shadda
  ]);

  let ipa = "";
  for (const char of word) {
    if (map.has(char)) {
      ipa += map.get(char);
    } else if (char === " ") {
      ipa += " ";
    }
  }

  return ipa ? `/${ipa}/` : "/?.../";
}

// English - mostly needs lookup, but basic fallback
function englishToIPA(word: string): string {
  // Very basic - English is too irregular for rules
  // Just return a marker that it needs manual review
  return `[${word.toLowerCase()}]`;
}

// Latin (for scientific names) - classical pronunciation
function latinToIPA(word: string): string {
  const map: Record<string, string> = {
    a: "a", e: "ɛ", i: "ɪ", o: "ɔ", u: "ʊ",
    b: "b", c: "k", d: "d", f: "f", g: "ɡ", h: "h",
    k: "k", l: "l", m: "m", n: "n", p: "p", q: "kʷ",
    r: "r", s: "s", t: "t", v: "w", x: "ks", z: "z",
  };

  let ipa = "";
  const lower = word.toLowerCase();

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (map[char]) {
      ipa += map[char];
    } else if (char === " ") {
      ipa += " ";
    }
  }

  return `/${ipa}/`;
}

function generateIPA(word: string, lang: string): string {
  switch (lang) {
    case "tur": return turkishToIPA(word);
    case "ell": return greekToIPA(word);
    case "ara": return arabicToIPA(word);
    case "eng": return englishToIPA(word);
    case "lat": return latinToIPA(word);
    default: return `[${word}]`;
  }
}

// Process all names
const update = db.prepare("UPDATE names SET phonetic = ? WHERE id = ?");

let wiktionaryHits = 0;
let ruleGenerated = 0;

for (const { id, name, lang } of names) {
  // Try Wiktionary first
  const wikiIPA = await queryWiktionary(name, lang);

  let ipa: string;
  if (wikiIPA) {
    ipa = wikiIPA;
    wiktionaryHits++;
    console.log(`✓ ${name} [${lang}]: ${ipa} [Wiktionary]`);
  } else {
    ipa = generateIPA(name, lang);
    ruleGenerated++;
    console.log(`○ ${name} [${lang}]: ${ipa} [generated]`);
  }

  update.run(ipa, id);

  // Rate limit Wiktionary requests
  await new Promise(r => setTimeout(r, 100));
}

console.log(`\n${"=".repeat(50)}`);
console.log(`Done! ${wiktionaryHits} from Wiktionary, ${ruleGenerated} generated`);

db.close();
