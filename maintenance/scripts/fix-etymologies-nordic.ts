import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Standardized etymologies and notes
// Format:
// - Original: "meaning\npart: meaning, part: meaning"
// - Borrowed: "From [Lang] word (meaning)\npart: meaning, part: meaning\n↳ deeper origin"
// - Extra context goes to notes

const updates: { id: string; etymology: string; notes: string | null }[] = [
  // ============================================
  // FINNISH (fin)
  // ============================================
  {
    id: "nm_0140",
    etymology: "From Proto-Finnic *lohi (salmon)\n↳ Possibly from PIE *laks- (salmon)",
    notes: "Cognate with Estonian lõhi",
  },
  {
    id: "nm_0141",
    etymology: "From Proto-Finnic *ahven (perch)\n↳ From Proto-Uralic",
    notes: "Cognate with Estonian ahven, Hungarian related forms. Finland's national fish.",
  },
  {
    id: "nm_0142",
    etymology: "From Proto-Finnic *haugi (pike)\n↳ From Proto-Uralic *šawka",
    notes: "Cognate with Estonian haug, Hungarian csuka",
  },
  {
    id: "nm_0143",
    etymology: "From Proto-Finnic *kuha (pikeperch)",
    notes: "Cognate with Estonian koha. Prized for its white, flaky flesh.",
  },
  {
    id: "nm_0144",
    etymology: "From Proto-Finnic *taimen (trout)\n↳ Related to Proto-Uralic fish terminology",
    notes: "Cognate with Estonian taimen",
  },
  {
    id: "nm_0145",
    etymology: "From Proto-Finnic *siika (whitefish)",
    notes: "Cognate with Estonian siig. Important food fish in Finnish cuisine.",
  },
  {
    id: "nm_0146",
    etymology: "Origin uncertain, possibly onomatopoeic or descriptive of the small silvery fish",
    notes: "A Finnish delicacy, especially fried (paistettu muikku)",
  },
  {
    id: "nm_0147",
    etymology: "From Proto-Finnic *mateh (burbot)",
    notes: "Cognate with Estonian made. The only freshwater cod family member.",
  },
  {
    id: "nm_0148",
    etymology: "From Proto-Finnic *lahna (bream)",
    notes: "Cognate with Estonian latikas. Common in nutrient-rich Finnish lakes.",
  },
  {
    id: "nm_0149",
    etymology: "From Proto-Finnic *särki (roach)",
    notes: "Cognate with Estonian särg. Most common cyprinid in Finland.",
  },
  {
    id: "nm_0150",
    etymology: "From Proto-Finnic *kuoreh (smelt)",
    notes: "Also called norssi. Known for its cucumber-like smell.",
  },
  {
    id: "nm_0151",
    etymology: "From Swedish sillake (salted herring)\nsill: herring, lake: brine\n↳ Or from sill + Finnish diminutive -kka",
    notes: "Baltic Sea subspecies of Atlantic herring",
  },
  {
    id: "nm_0152",
    etymology: "From Proto-Finnic, describing spiny nature",
    notes: "Cognate with Estonian kiisk",
  },
  {
    id: "nm_0153",
    etymology: "From Proto-Finnic *sorva (rudd)",
    notes: "Known for its red fins, considered one of Finland's most beautiful fish",
  },
  {
    id: "nm_0154",
    etymology: "Possibly from Finnish sala (secret, hidden), describing surface-swimming behavior",
    notes: null,
  },
  {
    id: "nm_0155",
    etymology: "From Proto-Finnic (ide)",
    notes: "Cognate with Estonian säinas. Large cyprinid often mistaken for large roach.",
  },
  {
    id: "nm_0156",
    etymology: "Finnish name, origin uncertain",
    notes: "Resembles lahna (bream) but smaller with proportionally larger eyes",
  },
  {
    id: "nm_0157",
    etymology: "From Proto-Finnic (crucian carp)",
    notes: "Can survive in oxygen-poor conditions by producing alcohol in its tissues",
  },
  {
    id: "nm_0158",
    etymology: "Finnish suutari (cobbler, shoemaker)\nsuutari: one who makes/repairs shoes",
    notes: "Named for its dark, leathery appearance",
  },
  {
    id: "nm_0159",
    etymology: "Compound: kolmi + piikki\nkolmi: three, piikki: spike/spine",
    notes: "Descriptive of its three dorsal spines",
  },
  {
    id: "nm_0180",
    etymology: "Compound: kirjo + lohi\nkirjo: colorful/variegated, lohi: salmon",
    notes: "Named for its colorful spotted appearance. Introduced from North America.",
  },
  {
    id: "nm_0264",
    etymology: "From Swedish nors (smelt)",
    notes: "Dialectal variant of kuore",
  },
  {
    id: "nm_0265",
    etymology: "Origin uncertain",
    notes: "Regional dialectal variant of kuore",
  },
  {
    id: "nm_0266",
    etymology: "From Finnish sininen (blue)\nsininen: blue, -äinen: diminutive suffix",
    notes: "Named for bluish tint of fresh smelt. Regional variant of kuore.",
  },
  {
    id: "nm_0267",
    etymology: "From Swedish sill (herring)",
    notes: "Often used for prepared/salted herring rather than fresh Baltic herring",
  },
  {
    id: "nm_0308",
    etymology: "Compound: meri + taimen\nmeri: sea, taimen: trout",
    notes: "Sea-run anadromous form of brown trout (Salmo trutta)",
  },

  // ============================================
  // SWEDISH (swe) - Sweden
  // ============================================
  {
    id: "nm_0205",
    etymology: "From Old Norse aborri (perch)\n↳ From Proto-Germanic *aburô",
    notes: "Cognate with German Barsch",
  },
  {
    id: "nm_0206",
    etymology: "From Old Norse gedda (pike)\n↳ Possibly related to gaddr (spike, sting)",
    notes: "Named for its pointed snout",
  },
  {
    id: "nm_0207",
    etymology: "From Old Norse gǫ́s (pikeperch)\n↳ Related to German dialectal Gös",
    notes: "Prized game fish in Sweden",
  },
  {
    id: "nm_0208",
    etymology: "From Old Norse lax (salmon)\n↳ From Proto-Germanic *lahsaz\n↳ From PIE *laks- (salmon)",
    notes: "Cognate with German Lachs, English lox",
  },
  {
    id: "nm_0209",
    etymology: "From Old Norse aurriði, auringr (trout)\n↳ Possibly related to aurr (gravel, sand)",
    notes: "Named for gravel beds where trout spawn",
  },
  {
    id: "nm_0210",
    etymology: "From Old Norse síkr (whitefish)\n↳ From Proto-Germanic *sīkaz",
    notes: "Source of Finnish siika (borrowed)",
  },
  {
    id: "nm_0211",
    etymology: "Compound: sik + löja\nsik: whitefish, löja: bleak",
    notes: "Describes this small whitefish species",
  },
  {
    id: "nm_0212",
    etymology: "From Old Norse laki (burbot)\n↳ Possibly related to laka (to drip)",
    notes: "Named for its slimy skin",
  },
  {
    id: "nm_0213",
    etymology: "From Old Norse braxn (bream)\n↳ From Proto-Germanic *brahsmō",
    notes: "Cognate with German Brassen, Brachse",
  },
  {
    id: "nm_0214",
    etymology: "From Old Norse mort, murt (roach)\n↳ Related to words for crumbling/soft",
    notes: "Possibly describing the soft flesh",
  },
  {
    id: "nm_0215",
    etymology: "From Old Norse nǫrs (smelt)",
    notes: "Known for its cucumber-like smell. Also called slom in some dialects.",
  },
  {
    id: "nm_0216",
    etymology: "From Swedish ström (stream, current)\nström: stream/current, -ming: noun suffix",
    notes: "Named for schooling behavior in currents. Baltic herring.",
  },
  {
    id: "nm_0217",
    etymology: "From Old Norse gersi (ruffe)\n↳ Related to words for rough/spiny",
    notes: "Named for its spiny fins. Also called snorgärs (slimy ruffe).",
  },
  {
    id: "nm_0218",
    etymology: "From Old Norse sǫrfr (rudd)",
    notes: "Known for red fins and golden scales",
  },
  {
    id: "nm_0219",
    etymology: "From Old Norse *lauja (bleak)\n↳ Related to ljós (light)",
    notes: "Named for its silvery, shiny scales",
  },
  {
    id: "nm_0220",
    etymology: "From Old Norse ið (ide)",
    notes: "The golden variety is called guldid (golden ide)",
  },
  {
    id: "nm_0221",
    etymology: "Possibly from Swedish björk (birch)\nbjörk: birch tree",
    notes: "Named for silvery color resembling birch bark",
  },
  {
    id: "nm_0222",
    etymology: "From Old Norse ruða (crucian carp)\n↳ Related to ruðr (red)",
    notes: "Possibly named for coloration",
  },
  {
    id: "nm_0223",
    etymology: "From Old Norse sútari (cobbler, shoemaker)\nsútari: one who makes/repairs shoes",
    notes: "Same naming metaphor as Finnish suutari",
  },
  {
    id: "nm_0224",
    etymology: "Compound: stor + spigg\nstor: large, spigg: stickleback",
    notes: "Distinguished from småspigg (nine-spined stickleback)",
  },
  {
    id: "nm_0225",
    etymology: "Calque from English rainbow trout\nregn: rain, båge: arc/bow",
    notes: "Named for colorful pink-red lateral stripe",
  },
  {
    id: "nm_0309",
    etymology: "Compound: hav + öring\nhav: sea, öring: trout",
    notes: "Sea-run anadromous form of brown trout",
  },

  // ============================================
  // SWEDISH (swe) - Finland-Swedish
  // ============================================
  {
    id: "nm_0287",
    etymology: "From Old Norse aborri (perch)\n↳ From Proto-Germanic *aburô",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0288",
    etymology: "From Old Norse gedda (pike)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0289",
    etymology: "From Old Norse gǫ́s (pikeperch)",
    notes: "Same as Sweden-Swedish. Prized game fish in coastal Finland.",
  },
  {
    id: "nm_0290",
    etymology: "From Old Norse lax (salmon)\n↳ From Proto-Germanic *lahsaz",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0291",
    etymology: "From Old Norse aurriði (trout)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0292",
    etymology: "From Old Norse síkr (whitefish)",
    notes: "Same as Sweden-Swedish. Important in Finland-Swedish cuisine.",
  },
  {
    id: "nm_0293",
    etymology: "From Finnish muikku (vendace)",
    notes: "Finland-Swedish borrowing. Differs from Sweden-Swedish siklöja.",
  },
  {
    id: "nm_0294",
    etymology: "From Old Norse laki (burbot)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0295",
    etymology: "From Old Norse braxn (bream)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0296",
    etymology: "From Old Norse mort (roach)",
    notes: "Same as Sweden-Swedish. Common in Finnish lakes.",
  },
  {
    id: "nm_0297",
    etymology: "From Old Norse nǫrs (smelt)",
    notes: "Same as Sweden-Swedish. Known for cucumber-like smell.",
  },
  {
    id: "nm_0298",
    etymology: "From Swedish ström (stream, current)",
    notes: "Same as Sweden-Swedish. Baltic herring, staple in archipelago cuisine.",
  },
  {
    id: "nm_0299",
    etymology: "From Old Norse gersi (ruffe)",
    notes: "Spelling variant of Sweden-Swedish gärs",
  },
  {
    id: "nm_0300",
    etymology: "From Old Norse sǫrfr (rudd)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0301",
    etymology: "From Old Norse *lauja (bleak)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0302",
    etymology: "From Old Norse ið (ide)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0303",
    etymology: "Possibly from Swedish björk (birch)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0304",
    etymology: "From Old Norse ruða (crucian carp)",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0305",
    etymology: "From Old Norse sútari (cobbler)",
    notes: "Same as Sweden-Swedish. Same metaphor as Finnish suutari.",
  },
  {
    id: "nm_0306",
    etymology: "Compound: stor + spigg\nstor: large, spigg: stickleback",
    notes: "Same as Sweden-Swedish",
  },
  {
    id: "nm_0307",
    etymology: "Calque from English rainbow trout\nregn: rain, båge: arc/bow",
    notes: "Same as Sweden-Swedish. Introduced species.",
  },
  {
    id: "nm_0310",
    etymology: "Compound: hav + öring\nhav: sea, öring: trout",
    notes: "Finland-Swedish. Sea-run form of brown trout.",
  },

  // ============================================
  // ESTONIAN (est)
  // ============================================
  {
    id: "nm_0268",
    etymology: "From Proto-Finnic *ahven (perch)",
    notes: "Cognate with Finnish ahven - identical form",
  },
  {
    id: "nm_0269",
    etymology: "From Proto-Finnic *haugi (pike)",
    notes: "Cognate with Finnish hauki - shows Finnic sound correspondence",
  },
  {
    id: "nm_0270",
    etymology: "From Proto-Finnic *kuha (pikeperch)",
    notes: "Cognate with Finnish kuha - Estonian o corresponds to Finnish u",
  },
  {
    id: "nm_0271",
    etymology: "From Proto-Finnic *lohi (salmon)",
    notes: "Cognate with Finnish lohi - Estonian õ corresponds to Finnish o",
  },
  {
    id: "nm_0272",
    etymology: "From Proto-Finnic *siika (whitefish)",
    notes: "Cognate with Finnish siika",
  },
  {
    id: "nm_0273",
    etymology: "From Proto-Finnic *mateh (burbot)",
    notes: "Cognate with Finnish made - identical form",
  },
  {
    id: "nm_0274",
    etymology: "Estonian name, possibly related to latt (flat)",
    notes: "Compare Finnish lahna - different Finnic development",
  },
  {
    id: "nm_0275",
    etymology: "From Proto-Finnic *särki (roach)",
    notes: "Cognate with Finnish särki",
  },
  {
    id: "nm_0276",
    etymology: "Native Estonian/Finnic word for Baltic herring",
    notes: "Compare Finnish silakka (Swedish loan) - räim is native Finnic",
  },
  {
    id: "nm_0277",
    etymology: "From German Forelle (trout)",
    notes: "Also: meriforell (sea trout)",
  },
  {
    id: "nm_0278",
    etymology: "From Proto-Finnic (ruffe)",
    notes: "Cognate with Finnish kiiski - nearly identical form",
  },
  {
    id: "nm_0279",
    etymology: "Estonian name for tench",
    notes: "Compare Finnish suutari (cobbler) - different naming metaphor",
  },
  {
    id: "nm_0280",
    etymology: "Estonian name for crucian carp",
    notes: "Compare Finnish ruutana",
  },
  {
    id: "nm_0281",
    etymology: "Calque from English rainbow trout\nviker: rainbow, forell: trout",
    notes: null,
  },

  // ============================================
  // NORTHERN SAMI (sme)
  // ============================================
  {
    id: "nm_0282",
    etymology: "Northern Sami native word for salmon",
    notes: "Central to Sami culture and fishing traditions along rivers like Tana/Deatnu",
  },
  {
    id: "nm_0283",
    etymology: "Northern Sami word meaning 'fish' (generic)",
    notes: "Also used in compounds for specific fish types",
  },
  {
    id: "nm_0284",
    etymology: "Northern Sami native word for pike",
    notes: "Compare Finnish hauki, Swedish gädda",
  },
  {
    id: "nm_0285",
    etymology: "Northern Sami native word for whitefish",
    notes: "Important food fish in Sami tradition",
  },
  {
    id: "nm_0286",
    etymology: "Northern Sami native word for trout",
    notes: null,
  },
];

const updateStmt = db.prepare(`
  UPDATE names SET etymology = $etymology, notes = $notes WHERE id = $id
`);

let updated = 0;
for (const u of updates) {
  updateStmt.run({ $id: u.id, $etymology: u.etymology, $notes: u.notes });
  updated++;
}

console.log(`Updated ${updated} etymologies`);

// Show sample of updated etymologies
console.log("\nSample updated etymologies:\n");

const samples = db.query(`
  SELECT id, name, lang, etymology, notes
  FROM names
  WHERE id IN ('nm_0159', 'nm_0208', 'nm_0151', 'nm_0293', 'nm_0281')
  ORDER BY id
`).all() as { id: string; name: string; lang: string; etymology: string; notes: string }[];

for (const s of samples) {
  console.log(`[${s.id}] ${s.name} (${s.lang})`);
  console.log(`Etymology: ${s.etymology}`);
  if (s.notes) console.log(`Notes: ${s.notes}`);
  console.log();
}

db.close();
