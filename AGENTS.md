# LinkedFin Agent Guidelines

## Adding New Data

### Workflow for Adding a New Country/Region

1. **Research fish species** from authoritative sources (government fisheries, Wikipedia, academic sources)
2. **Cross-reference scientific names** with multiple sources
3. **Add region first**, then species (if new), then names
4. **Build relations** after names exist
5. **Update UI language map** if new language code

### Step 1: Add New Region

```sql
INSERT INTO regions (id, name, name_local, language, parent_region, notes)
VALUES (
  'norway',                    -- id: lowercase, hyphenated (e.g., 'turkish-aegean')
  'Norway',                    -- name: English name
  'Norge',                     -- name_local: Native name (nullable)
  'Norwegian',                 -- language: Primary language name
  NULL,                        -- parent_region: For sub-regions (e.g., 'arabic' for 'arabic-egypt')
  'Norwegian freshwater and coastal fish'  -- notes
);
```

**Region ID conventions:**
- Country: `norway`, `japan`, `russia`
- Sub-region: `country-region` e.g., `turkish-aegean`, `arabic-levant`
- Special: `international` (for scientific/English names), `sapmi` (cross-border Sami region)

### Step 2: Add New Language to UI

Edit `index.html` language map:

```javascript
const langNames = {
  tur: 'Turkish', ell: 'Greek', eng: 'English', lat: 'Latin',
  fin: 'Finnish', swe: 'Swedish', est: 'Estonian', sme: 'Northern Sami',
  arb: 'Standard Arabic',    // MSA/formal
  arz: 'Egyptian Arabic',    // Egyptian colloquial
  apc: 'Levantine Arabic',   // Levantine colloquial
  nor: 'Norwegian',          // ← Add new language
};
```

**Language codes:** Use ISO 639-3 (3-letter codes):

Arabic varieties (use dialect codes, not generic `ara`):
- `arb`: Standard Arabic (MSA/formal written)
- `arz`: Egyptian Arabic (colloquial)
- `apc`: Levantine Arabic (colloquial)
- `ary`: Moroccan Arabic (if adding Maghreb)

Other languages:
- Norwegian: `nor` (or `nob`/`nno` for Bokmål/Nynorsk)
- Russian: `rus`
- Japanese: `jpn`
- Spanish: `spa`
- Portuguese: `por`

### Step 3: Add New Species

First check if species already exists:

```sql
SELECT id, scientific_name FROM species WHERE scientific_name LIKE '%salmo%';
```

Get next available ID:

```sql
SELECT 'sp_' || printf('%03d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM species;
```

Add new species:

```sql
INSERT INTO species (id, scientific_name, family, habitat, notes)
VALUES (
  'sp_050',                    -- id: sp_XXX format
  'Gadus morhua',              -- scientific_name: Genus species (unique)
  'Gadidae',                   -- family: taxonomic family (nullable)
  'marine',                    -- habitat: 'marine', 'freshwater', or 'brackish'
  'Atlantic cod, important commercial species'  -- notes
);
```

### Step 4: Add New Names

Get next available ID:

```sql
SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM names;
```

**Required fields by language (enforced by trigger):**

| Language | transliteration | phonetic |
|----------|-----------------|----------|
| Standard Arabic (arb) | REQUIRED | recommended |
| Egyptian Arabic (arz) | REQUIRED | recommended |
| Levantine Arabic (apc) | REQUIRED | recommended |
| Greek (ell) | REQUIRED | recommended |
| Finnish (fin) | REQUIRED | REQUIRED |
| Swedish (swe) | REQUIRED | REQUIRED |
| Estonian (est) | REQUIRED | REQUIRED |
| English (eng) | not needed | optional |
| Others | recommended | recommended |

**Insert template:**

```sql
INSERT INTO names (
  id, name, species_id, region_id, lang,
  etymology, transliteration, phonetic, notes
) VALUES (
  'nm_0312',           -- id
  'Torsk',             -- name: Native script
  'sp_050',            -- species_id: Must exist
  'norway',            -- region_id: Must exist
  'nor',               -- lang: ISO 639-3
  'From Old Norse þorskr (cod)',  -- etymology
  'Torsk',             -- transliteration: Latin-script version
  'tɔʂk',              -- phonetic: IPA
  'Important food fish in Norway'  -- notes
);
```

### Step 5: Add International/English Name

Always add an English name for new species:

```sql
INSERT INTO names (id, name, species_id, region_id, lang, etymology, phonetic, notes)
VALUES (
  'nm_0313',
  'Atlantic cod',
  'sp_050',
  'international',
  'eng',
  'From Middle English cod, origin uncertain',
  'ətˈlæntɪk kɒd',
  'One of the most commercially important fish species'
);
```

### Step 6: Build Relations

After adding names, create relevant relations:

```sql
-- Cross-language equivalents (same region, different languages)
INSERT INTO name_relations (source_id, target_id, relation, notes)
VALUES ('nm_norwegian', 'nm_sami', 'alternate_of', 'Norwegian ↔ Sami equivalent');

-- Borrowings
INSERT INTO name_relations (source_id, target_id, relation, notes)
VALUES ('nm_borrowed', 'nm_source', 'borrowed_from', 'Borrowed from [language]');

-- Species confusion
INSERT INTO name_relations (source_id, target_id, relation, notes)
VALUES ('nm_fish1', 'nm_fish2', 'confused_with', 'Often confused due to similar appearance');
```

### Complete Example: Adding Norwegian Fish

```typescript
// 1. Add region
db.run(`INSERT INTO regions (id, name, name_local, language, notes)
        VALUES ('norway', 'Norway', 'Norge', 'Norwegian', 'Norwegian fish names')`);

// 2. Check/add species
// Gadus morhua (cod) - check if exists first

// 3. Add Norwegian name
db.run(`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
        VALUES ('nm_0312', 'Torsk', 'sp_050', 'norway', 'nor',
                'From Old Norse þorskr (cod)', 'Torsk', 'tɔʂk', NULL)`);

// 4. Add English name if species is new
db.run(`INSERT INTO names (id, name, species_id, region_id, lang, etymology, phonetic, notes)
        VALUES ('nm_0313', 'Atlantic cod', 'sp_050', 'international', 'eng',
                'From Middle English cod, origin uncertain', 'ətˈlæntɪk kɒd', NULL)`);

// 5. Build relations if applicable
```

### Verification Queries

After adding data, verify:

```sql
-- Check new region
SELECT * FROM regions WHERE id = 'norway';

-- Check new species
SELECT * FROM species WHERE id = 'sp_050';

-- Check new names with joins
SELECT n.name, n.lang, s.scientific_name, r.name as region
FROM names n
JOIN species s ON n.species_id = s.id
JOIN regions r ON n.region_id = r.id
WHERE n.region_id = 'norway';

-- Check relations
SELECT n1.name, r.relation, n2.name
FROM name_relations r
JOIN names n1 ON r.source_id = n1.id
JOIN names n2 ON r.target_id = n2.id
WHERE n1.region_id = 'norway' OR n2.region_id = 'norway';
```

### Research Sources by Region

| Region | Recommended Sources |
|--------|---------------------|
| Nordic | ahven.net, artsdatabanken.no, fiskbasen.se |
| Mediterranean | fishbase.org, FAO species catalogs |
| Japan | fishbase.org, Japanese Fisheries Agency |
| Russia | fishbase.org, academic sources |
| General | Wikipedia (cross-reference), Wiktionary (etymology) |

---

## Etymology Format Standard

When adding or editing name etymologies, follow this format exactly:

### Basic Format

```
From [language] word (meaning)
```

**Examples:**
- `From Turkish yaprak (leaf)`
- `From Greek σαρδέλα sardéla (pilchard)`
- `From Arabic marjān (coral)`

### Compound Names

For compound words, use multi-line format with parts on second line:

```
Compound: part1 + part2
part1: meaning, part2: meaning
```

**Examples:**
```
Compound: kolmi + piikki
kolmi: three, piikki: spike/spine
```

```
Compound: hav + öring
hav: sea, öring: trout
```

```
Calque from English rainbow trout
regn: rain, båge: arc/bow
```

### Derivation Chains

When a word derives from an older form or another language, use `↳` on a new line:

```
From [language] word (meaning)
↳ From [older language] older_word (meaning)
```

**Examples:**
```
From Greek σαρδέλα sardéla (pilchard)
↳ From Latin sardina (Sardinia)
```

```
From Old Norse lax (salmon)
↳ From Proto-Germanic *lahsaz
↳ From PIE *laks- (salmon)
```

### What Goes in Notes (Not Etymology)

Move this information to the `notes` field:

1. **Literal translations**: "Literally 'black-backed'"
2. **Usage context**: "Used in Aegean/Mediterranean region"
3. **Cultural info**: "Central to Sami fishing traditions"
4. **Size/class info**: "Refers to smallest size class of bluefish"
5. **Cognates**: "Cognate with Estonian lõhi"
6. **Historical context**: "Not native - farmed in Marmara region"
7. **Disputed origins**: "Etymology contested between Turkish and Greek origins"

### Format Checklist

✓ Meaning in parentheses: `word (meaning)` not `word meaning X`
✓ No equals sign: `word (meaning)` not `word = meaning`
✓ No quotes around meaning: `(tooth)` not `("tooth")`
✓ Derivation chains use `↳` on new lines
✓ Context/cultural info in notes field
✓ Include transliteration for non-Latin scripts: `σαρδέλα sardéla`

### Validation Command

Export and review all etymologies:

```bash
sqlite3 fish.db "SELECT name || '|' || COALESCE(etymology, '') || '|' || COALESCE(notes, '') FROM names" > /tmp/etymologies.txt
```

---

## Transliteration Requirements

### Required Languages (enforced by database trigger)

**Arabic (arb, arz, apc)** and **Greek (ell)** names MUST have a `transliteration` field. The database will reject inserts/updates without it.

### Transliteration Standards

**Arabic** - Use DIN 31635 romanization with vowels:
- Include long vowels: ā, ī, ū
- Include emphatic consonants: ṣ, ṭ, ḍ, ẓ
- Include ʿayn: ʿ
- Include hamza: ʾ

**Examples:**
| Arabic | Transliteration |
|--------|----------------|
| سلطان ابراهيم | Sulṭān Ibrāhīm |
| حبار | Ḥabbār |
| ثعبان البحر | Thuʿbān al-baḥr |

**Greek** - Use standard romanization with accents:
- Include stress accents: á, é, í, ó, ú
- μπ at word start = b: Μπαρμπούνι → Barboúni
- μπ mid-word = mb: keep as mb
- ου = ou (not oy)
- γγ/γκ = ng/nk

**Examples:**
| Greek | Transliteration |
|-------|----------------|
| Συναγρίδα | Synagrída |
| Μπαρμπούνι | Barboúni |
| Χταπόδι | Chtapódi |

### Required for Nordic Languages

**Finnish (fin)**, **Swedish (swe)**, **Estonian (est)** names MUST have transliterations:

| Language | Conversion |
|----------|-----------|
| Finnish | ä→a, ö→o |
| Swedish | å→a, ä→a, ö→o |
| Estonian | õ→o, ä→a, ö→o, ü→u |

**Examples:**
| Original | Transliteration |
|----------|----------------|
| Särki (fin) | Sarki |
| Gädda (swe) | Gadda |
| Lõhi (est) | Lohi |

### Optional

**Turkish (tur)** and **Sami (sme)** - transliteration recommended for special characters:
- Turkish: ğ→g, ı→i, ş→s, ç→c, ö→o, ü→u
- Sami: č→c, đ→d, ŋ→n, š→s, ŧ→t, ž→z

### Not Required

**English (eng)** - Standard Latin script, no transliteration needed.

---

## Name Relations

### Relation Types

| Relation | Meaning | Direction |
|----------|---------|-----------|
| `borrowed_from` | Source borrowed from target | source ← target |
| `alternate_of` | Different name for same thing | bidirectional |
| `smaller_than` | Size progression | source < target |
| `confused_with` | Different species, often confused | bidirectional |

### When to Use Each

**borrowed_from** - Linguistic borrowing between languages:
```sql
-- Finnish silakka borrowed from Swedish strömming
INSERT INTO name_relations VALUES ('nm_silakka', 'nm_stromming', 'borrowed_from', 'Finnish silakka from Swedish sill + lake');
```

**alternate_of** - Same species, different names:
- Dialectal variants: Kuore ↔ Norssi ↔ Kurvi (all Finnish smelt)
- Cross-language equivalents: Finnish Ahven ↔ Finland-Swedish Abborre
- Regional variants: Finland-Swedish Mujka ↔ Sweden-Swedish Siklöja

**confused_with** - Different species commonly confused:
```sql
-- Kirjolohi (rainbow trout) often confused with Lohi (salmon)
INSERT INTO name_relations VALUES ('nm_kirjolohi', 'nm_lohi', 'confused_with', 'Both called -lohi but different genera');
```

### Cross-Language Relations

When same region has multiple languages (e.g., Finland: Finnish + Swedish), create `alternate_of` relations:

```
Finnish (Finland)     Finland-Swedish (Finland)
─────────────────     ─────────────────────────
Ahven        ←────alternate_of────→  Abborre
Hauki        ←────alternate_of────→  Gädda
Muikku       ←────alternate_of────→  Mujka
```

---

## Regional/Dialect Handling

### Schema: region_id + lang

The combination allows fine-grained distinction:

| region_id | lang | Meaning |
|-----------|------|---------|
| finland | fin | Finnish in Finland |
| finland | swe | Finland-Swedish |
| sweden | swe | Sweden-Swedish |
| finland | sme | Northern Sami in Finland |
| estonia | est | Estonian |

### Adding Dialectal Variants

1. Add as separate name entry (same species, same region, same lang)
2. Create `alternate_of` relation to standard name
3. Document in notes: "Dialectal variant of X"

**Example:** Finnish smelt variants
```
nm_0150: Kuore (standard)
nm_0264: Norssi (dialectal) → alternate_of → Kuore
nm_0265: Kurvi (regional) → alternate_of → Kuore
nm_0266: Siniäinen (regional) → alternate_of → Kuore
```

### Borrowing Chains

Track multi-language borrowings:

```
Swedish: Siklöja (native)
    ↓ borrowed_from (reversed in Mujka)
Finland-Swedish: Mujka ← Finnish: Muikku
    ↓ borrowed_from
Finnish: Muikku (native Finnic)
```
