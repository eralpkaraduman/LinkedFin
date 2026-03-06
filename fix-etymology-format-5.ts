import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Fix Finnish entries - move cognate info to notes
const fixes: { name: string; etymology: string; notes?: string }[] = [
  // Finnish names
  {
    name: "Lohi",
    etymology: "From Proto-Finnic *lohi (salmon)",
    notes: "Possibly related to PIE *laks-. Cognate with Estonian lõhi."
  },
  {
    name: "Ahven",
    etymology: "From Proto-Finnic *ahven (perch)",
    notes: "From Proto-Uralic. Cognate with Estonian ahven. Finland's national fish."
  },
  {
    name: "Hauki",
    etymology: "From Proto-Finnic *haugi (pike)",
    notes: "From Proto-Uralic *šawka. Cognate with Estonian haug, Hungarian csuka."
  },
  {
    name: "Kuha",
    etymology: "From Proto-Finnic *kuha (pikeperch)",
    notes: "Cognate with Estonian koha. Prized for its white, flaky flesh."
  },
  {
    name: "Taimen",
    etymology: "From Proto-Finnic *taimen (trout)",
    notes: "Related to Proto-Uralic fish terminology. Cognate with Estonian taimen."
  },
  {
    name: "Siika",
    etymology: "From Proto-Finnic *siika (whitefish)",
    notes: "Cognate with Estonian siig. Important food fish in Finnish cuisine."
  },
  {
    name: "Muikku",
    etymology: "Possibly onomatopoeic",
    notes: "A Finnish delicacy, especially fried. Small silvery fish."
  },
  {
    name: "Made",
    etymology: "From Proto-Finnic *mateh (burbot)",
    notes: "Cognate with Estonian made. The only freshwater member of the cod family."
  },
  {
    name: "Lahna",
    etymology: "From Proto-Finnic *lahna (bream)",
    notes: "Cognate with Estonian latikas. Common in nutrient-rich Finnish lakes."
  },
  {
    name: "Särki",
    etymology: "From Proto-Finnic *särki (roach)",
    notes: "Cognate with Estonian särg. Most common cyprinid in Finland."
  },
  {
    name: "Kuore",
    etymology: "From Proto-Finnic *kuoreh (smelt)",
    notes: "Also called norssi. Known for its cucumber-like smell."
  },
  {
    name: "Silakka",
    etymology: "From Swedish sill (herring) + Finnish diminutive -kka",
    notes: "Baltic Sea subspecies of Atlantic herring."
  },
  {
    name: "Kiiski",
    etymology: "Possibly from Proto-Finnic (spiny)",
    notes: "Describing the spiny nature of the fish. Cognate with Estonian kiisk."
  },
  {
    name: "Sorva",
    etymology: "From Proto-Finnic *sorva (rudd)",
    notes: "Known for its red fins, considered one of Finland's most beautiful fish."
  },
  {
    name: "Salakka",
    etymology: "Possibly from Finnish sala (secret/hidden)",
    notes: "Describes its surface-swimming behavior."
  },
  {
    name: "Säyne",
    etymology: "From Proto-Finnic (ide)",
    notes: "Large cyprinid often mistaken for large roach. Cognate with Estonian säinas."
  },
  {
    name: "Pasuri",
    etymology: "Finnish name for white bream",
    notes: "Resembles lahna but smaller with proportionally larger eyes."
  },
  {
    name: "Ruutana",
    etymology: "From Proto-Finnic (crucian carp)",
    notes: "Can survive in oxygen-poor conditions by producing alcohol in its tissues."
  },
  {
    name: "Suutari",
    etymology: "From Finnish suutari (cobbler/shoemaker)",
    notes: "Possibly referring to its dark, leathery appearance."
  },
  {
    name: "Kolmipiikki",
    etymology: "From Finnish kolmi (three) + piikki (spike)",
    notes: "Named for its three dorsal spines."
  },
  {
    name: "Kirjolohi",
    etymology: "From Finnish kirjo (colorful) + lohi (salmon)",
    notes: "Named for its colorful spotted appearance."
  },
  {
    name: "Norssi",
    etymology: "From Swedish nors (smelt)",
    notes: "Dialectal variant of kuore."
  },
  {
    name: "Kurvi",
    etymology: "Origin uncertain",
    notes: "Regional dialectal variant of kuore."
  },
  {
    name: "Siniäinen",
    etymology: "From Finnish sininen (blue)",
    notes: "Possibly referring to bluish tint of fresh smelt. Regional variant of kuore."
  },
  {
    name: "Silli",
    etymology: "From Swedish sill (herring)",
    notes: "Often used for prepared/salted herring rather than fresh."
  },

  // English fish names
  {
    name: "European perch",
    etymology: "From Latin perca\n↳ From Greek πέρκη pérke (spotted)",
    notes: "Via Old French perche."
  },
  {
    name: "Northern pike",
    etymology: "From Middle English pike (pointed weapon)",
    notes: "Named for its pointed snout."
  },
  {
    name: "Pikeperch",
    etymology: "From English pike + perch",
    notes: "Named for pike-like body and perch family. Also called zander."
  },
  {
    name: "Zander",
    etymology: "From German Zander\n↳ From Middle Low German sandat",
    notes: "Possibly related to sand (its habitat preference)."
  },
  {
    name: "Brown trout",
    etymology: "From Latin tructa (trout)\n↳ From Greek τρώκτης trṓktēs (gnawer)",
    notes: "Via Old English truht. Brown refers to coloration."
  },
  {
    name: "European whitefish",
    etymology: "From English white + fish",
    notes: "Named for its white flesh. A salmonid across northern Europe."
  },
  {
    name: "Vendace",
    etymology: "From Old French vendese (dace)",
    notes: "A small whitefish species prized in Nordic cuisine."
  },
  {
    name: "Burbot",
    etymology: "From Old French bourbotte\n↳ Related to bourbe (mud)",
    notes: "Named for bottom-dwelling habits. The only freshwater cod."
  },
  {
    name: "Common bream",
    etymology: "From Old French bresme (bream)",
    notes: "Of Germanic origin. Also called bronze bream for its coloration."
  },
  {
    name: "Common roach",
    etymology: "From Old French roche (roach)",
    notes: "Possibly related to Latin rubeus (red), referring to red fins."
  },
  {
    name: "European smelt",
    etymology: "From Old English smelt (smelt)",
    notes: "Known for its distinctive cucumber-like odor when fresh."
  },
  {
    name: "Baltic herring",
    etymology: "From Baltic Sea + herring",
    notes: "A smaller subspecies of Atlantic herring endemic to the brackish Baltic Sea."
  },
  {
    name: "Ruffe",
    etymology: "From Middle English ruff (rough)",
    notes: "Named for its spiny dorsal fin."
  },
  {
    name: "Rudd",
    etymology: "From Old English rudu (redness)",
    notes: "Named for its distinctive red fins."
  },
  {
    name: "Bleak",
    etymology: "From Old Norse bleikja (to bleach)",
    notes: "Named for its pale, silvery coloration."
  },
  {
    name: "Ide",
    etymology: "From Swedish id (ide)",
    notes: "Also called orfe (golden variety). A large cyprinid."
  },
  {
    name: "White bream",
    etymology: "From English white + bream",
    notes: "Named for silvery-white coloration, distinct from bronze/common bream."
  },
  {
    name: "Crucian carp",
    etymology: "From German Karausche (crucian carp)\n↳ From Low German karusse",
    notes: "Can survive frozen into ice and low-oxygen conditions."
  },
  {
    name: "Tench",
    etymology: "From Late Latin tinca (tench)",
    notes: "Via Old French tenche. Known for its slimy, mucus-covered skin."
  },
  {
    name: "Three-spined stickleback",
    etymology: "From English three + spined + stickleback",
    notes: "Named for three dorsal spines. Famous for mating behavior studied by Tinbergen."
  },
  {
    name: "Rainbow trout",
    etymology: "From English rainbow + trout",
    notes: "Named for the colorful pink-red stripe along its lateral line."
  },

  // Swedish names
  {
    name: "Abborre",
    etymology: "From Old Norse aborri (perch)",
    notes: "From Proto-Germanic *aburô. Cognate with German Barsch."
  },
  {
    name: "Gädda",
    etymology: "From Old Norse gedda (pike)",
    notes: "Possibly related to gaddr (spike), referring to pointed snout."
  },
  {
    name: "Gös",
    etymology: "From Old Norse gǫ́s (pikeperch)",
    notes: "Related to German dialectal Gös. Prized game fish in Sweden."
  },
  {
    name: "Lax",
    etymology: "From Old Norse lax (salmon)\n↳ From Proto-Germanic *lahsaz\n↳ From PIE *laks- (salmon)",
    notes: "Cognate with German Lachs."
  },
  {
    name: "Öring",
    etymology: "From Old Norse aurriði (trout)",
    notes: "Possibly related to aurr (gravel) where trout spawn."
  },
  {
    name: "Sik",
    etymology: "From Old Norse síkr (whitefish)",
    notes: "From Proto-Germanic *sīkaz. Finnish siika is borrowed from this."
  },
  {
    name: "Siklöja",
    etymology: "From Swedish sik (whitefish) + löja (bleak)",
    notes: "Compound describing this small whitefish species."
  },
  {
    name: "Lake",
    etymology: "From Old Norse laki (burbot)",
    notes: "Possibly related to laka (to drip), referring to slimy skin."
  },
  {
    name: "Braxen",
    etymology: "From Old Norse braxn (bream)\n↳ From Proto-Germanic *brahsmō",
    notes: "Cognate with German Brassen, Brachse."
  },
  {
    name: "Mört",
    etymology: "From Old Norse mort (roach)",
    notes: "Related to words for crumbling/soft, possibly describing flesh."
  },
  {
    name: "Nors",
    etymology: "From Old Norse nǫrs (smelt)",
    notes: "Known for its cucumber-like smell. Also called slom in some dialects."
  },
  {
    name: "Strömming",
    etymology: "From Swedish ström (stream/current)",
    notes: "Named for schooling behavior in currents. Baltic herring."
  },
  {
    name: "Gärs",
    etymology: "From Old Norse gersi (ruffe)",
    notes: "Related to words for rough/spiny, describing spiny fins."
  },
  {
    name: "Sarv",
    etymology: "From Old Norse sǫrfr (rudd)",
    notes: "Known for red fins and golden scales."
  },
  {
    name: "Löja",
    etymology: "From Old Norse *lauja (bleak)",
    notes: "Related to ljós (light), describing silvery shiny scales."
  },
  {
    name: "Id",
    etymology: "From Old Norse ið (ide)",
    notes: "The golden variety is called guldid."
  },
  {
    name: "Björkna",
    etymology: "Possibly from Swedish björk (birch)",
    notes: "Referring to silvery color like birch bark."
  },
  {
    name: "Ruda",
    etymology: "From Old Norse ruða (crucian carp)",
    notes: "Related to ruðr (red), possibly referring to coloration."
  },
  {
    name: "Sutare",
    etymology: "From Old Norse sútari (cobbler/shoemaker)",
    notes: "Same metaphor as Finnish suutari."
  },
  {
    name: "Storspigg",
    etymology: "From Swedish stor (large) + spigg (stickleback)",
    notes: "Distinguished from småspigg (nine-spined stickleback)."
  },
  {
    name: "Regnbåge",
    etymology: "From Swedish regnbåge (rainbow)",
    notes: "Calque from English rainbow trout. Named for colorful lateral stripe."
  },

  // Estonian names
  {
    name: "Ahven",
    etymology: "From Proto-Finnic *ahven (perch)",
    notes: "Cognate with Finnish ahven - identical form showing close Finnic relationship."
  },
  {
    name: "Haug",
    etymology: "From Proto-Finnic *haugi (pike)",
    notes: "Cognate with Finnish hauki - shows Finnic sound correspondence."
  },
  {
    name: "Koha",
    etymology: "From Proto-Finnic *kuha (pikeperch)",
    notes: "Cognate with Finnish kuha - shows regular Finnic vowel correspondence."
  },
  {
    name: "Lõhi",
    etymology: "From Proto-Finnic *lohi (salmon)",
    notes: "Cognate with Finnish lohi - Estonian õ corresponds to Finnish o."
  },
  {
    name: "Siig",
    etymology: "From Proto-Finnic *siika (whitefish)",
    notes: "Cognate with Finnish siika."
  },
  {
    name: "Made",
    etymology: "From Proto-Finnic *mateh (burbot)",
    notes: "Identical to Finnish made - shared Finnic inheritance."
  },
  {
    name: "Latikas",
    etymology: "Estonian name for bream",
    notes: "Compare Finnish lahna - different Finnic development."
  },
  {
    name: "Särg",
    etymology: "From Proto-Finnic *särki (roach)",
    notes: "Cognate with Finnish särki."
  },
  {
    name: "Räim",
    etymology: "Estonian native word for Baltic herring",
    notes: "Compare Finnish silakka (Swedish loan) - räim is native Finnic."
  },
  {
    name: "Forell",
    etymology: "From German Forelle (trout)",
    notes: "Also used: Meriforell (sea trout)."
  },
  {
    name: "Kiisk",
    etymology: "From Proto-Finnic (ruffe)",
    notes: "Cognate with Finnish kiiski - nearly identical form."
  },
  {
    name: "Linask",
    etymology: "Estonian name for tench",
    notes: "Compare Finnish suutari (cobbler) - different naming metaphor."
  },
  {
    name: "Koger",
    etymology: "Estonian name for crucian carp",
    notes: "Compare Finnish ruutana."
  },
  {
    name: "Vikerforell",
    etymology: "From Estonian viker (rainbow) + forell (trout)",
    notes: "Calque from English rainbow trout."
  },

  // Sami names
  {
    name: "Luossa",
    etymology: "Northern Sami word for salmon",
    notes: "Central to Sami culture and fishing traditions along rivers like Tana/Deatnu."
  },
  {
    name: "Guolli",
    etymology: "Northern Sami general word for fish",
    notes: "Also used in compounds for specific fish types."
  },
  {
    name: "Hávga",
    etymology: "Northern Sami word for pike",
    notes: "Compare Finnish hauki, Swedish gädda."
  },
  {
    name: "Čuovža",
    etymology: "Northern Sami word for whitefish",
    notes: "Important food fish in Sami tradition."
  },
  {
    name: "Dápmoš",
    etymology: "Northern Sami word for trout"
  },
];

const updateEtymology = db.prepare("UPDATE names SET etymology = ? WHERE name = ?");
const updateBoth = db.prepare("UPDATE names SET etymology = ?, notes = ? WHERE name = ?");

let fixed = 0;

for (const fix of fixes) {
  if (fix.notes !== undefined) {
    updateBoth.run(fix.etymology, fix.notes, fix.name);
  } else {
    updateEtymology.run(fix.etymology, fix.name);
  }
  console.log(`✓ ${fix.name}`);
  fixed++;
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
