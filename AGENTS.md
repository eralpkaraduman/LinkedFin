# LinkedFin Agent Guidelines

## Required Skills

**You MUST use the project's slash command skills for all data operations.** Do not write raw SQL for adding or updating data — use the appropriate skill instead:

| Operation | Skill |
|-----------|-------|
| Add a new species | `/add-species` |
| Add a new name | `/add-name` |
| Add a relation | `/add-relation` |
| Add species + names from Wikipedia | `/add-from-wiki` |
| Update an existing name | `/update-name` |
| Update an existing species | `/update-species` |
| Update or delete a relation | `/update-relation` |
| Search/inspect existing data | `/lookup` |
| Scan for quality problems | `/audit` |
| Process GitHub issues | `/process-issues` |

These skills enforce quality control checks that must not be bypassed. Every skill validates that:
- Etymologies are complete (every foreign word explained with meaning)
- Borrowing chains are fully traced (no unexplained intermediate languages)
- Discovered borrowings and misnomers are added as relations
- Transliterations and phonetics meet language-specific requirements
- Species notes describe the species itself, not language-specific names

---

## Database Commands

Run these from the project root:

| Command | Purpose |
|---------|---------|
| `pnpm db:types` | Regenerate TypeScript types from `public/fish.db` into `src/db/types.ts` |
| `pnpm db:validate` | Validate database integrity (`maintenance/scripts/validate-integrity.ts`) |
| `pnpm og:generate` | Generate `functions/og-data.json`, `public/sitemap.xml` and `.generated/` |
| `pnpm check` | Biome format + lint check |
| `pnpm pipeline` | Full gate — see below |

**Single source of truth:** `public/fish.db` is the canonical database. Every maintenance script, the OG generator, the validator, type generation, and the runtime app all read/write `public/fish.db` directly. There is no separate "source" copy — edit `public/fish.db` in place.

There is **no `pnpm db:copy` script.** Older one-off migration scripts under `maintenance/scripts/` still print "Run: pnpm db:copy" when they finish — ignore it. They are historical records of migrations that already ran, not things to execute again.

If `db:validate` reports a `page_size` mismatch, run **`pnpm db:fix-page-size`** and commit the rewritten `public/fish.db`. A page size can only be changed on a non-empty database by setting the pragma and then `VACUUM`ing; the pragma alone is silently ignored.

### `pnpm pipeline` is the deploy gate

`pnpm pipeline` is the command Cloudflare Pages runs to build the site, so whatever it rejects does not deploy. It currently runs:

```
pnpm rebuild better-sqlite3 → og:generate → check → tsc --noEmit (root)
→ tsc --noEmit -p functions/tsconfig.json → test → db:validate → build
```

**`pnpm og:generate` must run before `vite build`.** It reads `public/fish.db` and writes:

- `functions/og-data.json` — lookup tables for the Pages Functions middleware
- `public/sitemap.xml` — every indexable URL
- `.generated/fish-data.json` and `.generated/prerender-pages.json` — the prerender dataset and path list

All four are **gitignored**, so a checkout does not contain them and a build that skips `og:generate` fails or ships an empty site. `pnpm dev` and `pnpm build` both run it first for this reason.

### Running maintenance scripts

Use `tsx` (or `node --experimental-strip-types`):

```bash
pnpm tsx maintenance/scripts/your-migration.ts
```

**Do not use `bun`.** Bun cannot load the `better-sqlite3` native addon, which every maintenance script depends on.

### Schema Change Workflow

When modifying the database schema or adding data via scripts:

```bash
# 1. Run your migration/data script (operates on public/fish.db)
pnpm tsx maintenance/scripts/your-migration.ts

# 2. Regenerate types to match new schema
pnpm db:types

# 3. Validate integrity
pnpm db:validate
```

**Important:** Always regenerate types after schema changes to keep TypeScript in sync with the database.

**A plain data edit through one of the `/add-*` or `/update-*` commands is not a schema
change** — it does not add or rename a column, so it does not need `pnpm db:types`. It
only needs step 3: `pnpm db:validate` after the SQL runs, which is what each command's
own "Validate" step already calls. The three-step sequence above is for the rarer case of
changing the schema itself (e.g. the migration that added `updated_at` in commit `fdf22ce`),
not for routine name/species/relation edits.

---

## Schema Reference

Authoritative as of the current `public/fish.db` (`PRAGMA table_info`). Verify with
`sqlite3 public/fish.db ".schema"` before writing SQL — this document can drift.

**`species`** — four columns. There is **no `family` and no `habitat` column.**

| Column | Type | Null? |
|--------|------|-------|
| `id` | TEXT | NOT NULL, PK (`sp_XXX`) |
| `scientific_name` | TEXT | NOT NULL, UNIQUE |
| `notes` | TEXT | nullable |
| `updated_at` | TEXT | nullable, ISO 8601 UTC |

**`names`** — there is **no `notes` column.** (`species_notes` in `src/lib/types.ts` is a JOIN alias for `species.notes`, not a stored column.)

| Column | Type | Null? |
|--------|------|-------|
| `id` | TEXT | NOT NULL, PK (`nm_XXXX`) |
| `name` | TEXT | NOT NULL |
| `species_id` | TEXT | NOT NULL → `species(id)` |
| `region_id` | TEXT | NOT NULL → `regions(id)` |
| `lang` | TEXT | NOT NULL |
| `etymology` | TEXT | NOT NULL |
| `transliteration` | TEXT | NOT NULL |
| `phonetic` | TEXT | NOT NULL |
| `measurement_unit` | TEXT | nullable |
| `measurement_min` | REAL | nullable |
| `measurement_max` | REAL | nullable |
| `updated_at` | TEXT | nullable, ISO 8601 UTC |

**`updated_at` (both tables):** stamped by every `/add-*` and `/update-*` command via
`strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` — see the SQL in `add-name.md`, `update-name.md`,
`add-species.md`, `update-species.md`, `add-relation.md` and `update-relation.md`. It is
nullable only because rows written before commit `fdf22ce` have no value; every row
written from here on must set it. `pnpm db:validate` checks that populated values parse
as ISO 8601 and are not in the future.

**`regions` and `name_relations` have no `updated_at`, by design:**
- `regions` has no per-row timestamp because a region's own two columns (`id`, `name`)
  essentially never change; its meaningful "freshness" is derived — take `MAX(updated_at)`
  over the names in that region — not stored.
- `name_relations` has no `updated_at` because a relation edit (add, retype, delete) is
  defined to stamp **both endpoint `names` rows** instead (source_id and target_id). A
  relation only ever renders on the two `/name/$id` pages it connects, so that's where
  the freshness signal belongs. Do not add an `updated_at` column to either table to "fix"
  this — it would be redundant with the derivation/stamping rule above, not a correction
  of a gap.

**`regions`** — two columns. There is **no `name_local`, `language`, `parent_region` or `notes` column.**

| Column | Type | Null? |
|--------|------|-------|
| `id` | TEXT | NOT NULL, PK (lowercase kebab-case) |
| `name` | TEXT | NOT NULL |

**`name_relations`** (the table is named `name_relations`, not `relations`):

| Column | Type | Null? |
|--------|------|-------|
| `source_id` | TEXT | NOT NULL → `names(id)`, PK part |
| `target_id` | TEXT | NOT NULL → `names(id)`, PK part |
| `relation` | TEXT | NOT NULL, PK part |
| `notes` | TEXT | nullable |

**There are no triggers in the database.** Every rule below beyond NOT NULL/FK is enforced by `pnpm db:validate` (`maintenance/scripts/validate-integrity.ts`), not by SQLite.

---

## Adding New Data

### Workflow for Adding a New Country/Region

1. **Research fish species** from authoritative sources (government fisheries, Wikipedia, academic sources)
2. **Cross-reference scientific names** with multiple sources
3. **Add region first**, then species (if new), then names
4. **Build relations** after names exist
5. **Check the language display name** if new language code

### Step 1: Add New Region

`regions` has only `id` and `name`:

```sql
INSERT INTO regions (id, name)
VALUES (
  'norway',                    -- id: lowercase, hyphenated (e.g., 'turkish-aegean')
  'Norway'                     -- name: English name
);
```

There is nowhere in the schema to store a region's native name, primary language,
parent region, or notes. Sub-region relationships exist only by ID convention.

**Region ID conventions:**
- Country: `norway`, `japan`, `russia`
- Sub-region: `country-region` e.g., `turkish-aegean`, `arabic-levant`
- Special: `international` (for scientific/English names), `sapmi` (cross-border Sami region)

### Step 2: Check the Language Display Name

Display names come from `getLanguageName()` in `src/lib/language.ts`, which uses
`Intl.DisplayNames`. Most ISO 639-3 codes therefore need **no code change at all**.
Only add an entry to `LANGUAGE_NAME_OVERRIDES` when `Intl.DisplayNames` echoes the raw
code back or gives a wrong label — currently `arb`, `apc`, `arz`, `grc`, `sme`:

```ts
const LANGUAGE_NAME_OVERRIDES: Record<string, string> = {
  arb: "Standard Arabic",
  apc: "Levantine Arabic",
  arz: "Egyptian Arabic",
  grc: "Ancient Greek",
  sme: "Northern Sami",
};
```

`functions/og-utils.ts` carries a parallel map for the Pages Functions runtime; if you
add an override, check whether it needs the same entry.

**Language codes:** Use ISO 639-3 (3-letter codes). `pnpm db:validate` enforces
`/^[a-z]{3}$/` on `names.lang` — exactly three lowercase letters, nothing else.

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
INSERT INTO species (id, scientific_name, notes)
VALUES (
  'sp_050',                    -- id: sp_XXX format
  'Gadus morhua',              -- scientific_name: Genus species (unique)
  'Atlantic cod, important commercial species'  -- notes: nullable, but never an empty string
);
```

Taxonomic family and habitat have **no columns**. If that information is worth keeping,
it belongs in prose inside `notes`.

### Step 4: Add New Names

Get next available ID:

```sql
SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM names;
```

**Required fields — for every language, no exceptions:**

`etymology`, `transliteration` and `phonetic` are all `NOT NULL` in the schema, and
`pnpm db:validate` additionally rejects empty strings in each. This applies to English
too: an English name still needs a transliteration (the name itself, unchanged) and IPA.

`phonetic` must be wrapped in `/slashes/` (phonemic) or `[brackets]` (phonetic) —
the validator rejects bare IPA.

**Insert template:**

```sql
INSERT INTO names (
  id, name, species_id, region_id, lang,
  etymology, transliteration, phonetic
) VALUES (
  'nm_0312',           -- id
  'Torsk',             -- name: Native script
  'sp_050',            -- species_id: Must exist
  'norway',            -- region_id: Must exist
  'nor',               -- lang: ISO 639-3, /^[a-z]{3}$/
  'From Old Norse þorskr (cod)',  -- etymology: required
  'Torsk',             -- transliteration: Latin-script version, required
  '/tɔʂk/'             -- phonetic: IPA in slashes or brackets, required
);
```

`measurement_unit`, `measurement_min` and `measurement_max` are the only optional
columns; set them together or leave all three NULL.

**There is no `names.notes` column** — do not include one in an INSERT.

### Step 5: Add International/English Name

Always add an English name for new species:

```sql
INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
VALUES (
  'nm_0313',
  'Atlantic cod',
  'sp_050',
  'international',
  'eng',
  'From Middle English cod, origin uncertain',
  'Atlantic cod',
  '/ətˈlæntɪk kɒd/'
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
db.run(`INSERT INTO regions (id, name) VALUES ('norway', 'Norway')`);

// 2. Check/add species
// Gadus morhua (cod) - check if exists first

// 3. Add Norwegian name
db.run(`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
        VALUES ('nm_0312', 'Torsk', 'sp_050', 'norway', 'nor',
                'From Old Norse þorskr (cod)', 'Torsk', '/tɔʂk/')`);

// 4. Add English name if species is new
db.run(`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
        VALUES ('nm_0313', 'Atlantic cod', 'sp_050', 'international', 'eng',
                'From Middle English cod, origin uncertain', 'Atlantic cod', '/ətˈlæntɪk kɒd/')`);

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

### Research Sources

**Always research before adding or updating data.** Use these sources in order of preference:

| Priority | Source | Best for |
|----------|--------|----------|
| 1 | **Wiktionary** (all languages) | Etymology chains, borrowing history, cognates, word components |
| 2 | **FishBase** (fishbase.org) | Species data, scientific names, accepted taxonomy, habitat |
| 3 | **Wikipedia** (all languages) | Common names, regional usage, species descriptions |
| 4 | **Academic sources / Google Scholar** | Disputed etymologies, rare species, historical linguistics |

**Regional sources:**

| Region | Recommended Sources |
|--------|---------------------|
| Nordic | ahven.net, artsdatabanken.no, fiskbasen.se |
| Mediterranean | fishbase.org, FAO species catalogs |
| Japan | fishbase.org, Japanese Fisheries Agency |
| Russia | fishbase.org, academic sources |

**Research each component separately** for compound words. For borrowing chains, check Wiktionary in both the source and target languages.

**On habitat and taxonomy from FishBase:** useful for confirming the accepted scientific
name and for sanity-checking that a name refers to the species you think it does. But
there is **no `habitat` or `family` column** to store it in — the only place it can live
is prose in `species.notes`. Do not add columns for it as a side effect of adding data.

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

**Caveat:** the only `notes` columns that exist are `species.notes` and
`name_relations.notes`. `names` has none. Species-level facts go in `species.notes`;
the rationale for a relation goes in that relation's `notes`. Per-name usage and
cultural detail has no column today — do not invent one, and do not smuggle it into
`etymology` to work around the gap.

Keep this out of `etymology`:

1. **Literal translations**: "Literally 'black-backed'"
2. **Usage context**: "Used in Aegean/Mediterranean region"
3. **Cultural info**: "Central to Sami fishing traditions"
4. **Size/class info**: "Refers to smallest size class of bluefish"
5. **Cognates**: "Cognate with Estonian lõhi"
6. **Historical context**: "Not native - farmed in Marmara region"
7. **Disputed origins**: "Etymology contested between Turkish and Greek origins"

### Foreign Words in Etymologies

When an etymology mentions a word from another language, **always include its meaning or etymology** (if known). Do not leave foreign words unexplained.

**Before (incomplete):**
```
red mullet: from French surmulet
```

**After (complete):**
```
red mullet: from French surmulet
↳ From Old French sor (reddish-brown) + mulet (mullet)
```

**Before (incomplete):**
```
From Arabic مرجان marjān (coral)
```

**After (complete):**
```
From Arabic مرجان marjān (coral)
↳ marjān from Greek μαργαρίτης margarítēs (pearl) via Syriac
```

Use `↳` to chain deeper derivations. Mark uncertain etymologies with "possibly" or "origin uncertain". If the deeper etymology is truly unknown, note it: `(origin uncertain)`.

### Format Checklist

✓ Meaning in parentheses: `word (meaning)` not `word meaning X`
✓ No equals sign: `word (meaning)` not `word = meaning`
✓ No quotes around meaning: `(tooth)` not `("tooth")`
✓ Derivation chains use `↳` on new lines
✓ Context/cultural info in notes field
✓ Include transliteration for non-Latin scripts: `σαρδέλα sardéla`
✓ Foreign words must include meaning/etymology when known

### Validation Command

Export and review all etymologies:

```bash
sqlite3 public/fish.db "SELECT name || '|' || COALESCE(etymology, '') FROM names" > /tmp/etymologies.txt
```

---

## Transliteration Requirements

### Required for every language

`names.transliteration` is `NOT NULL`, and `pnpm db:validate` also rejects the empty
string. There is no per-language exemption and no database trigger. For Latin-script
languages that need no conversion, repeat the name itself. The rules below are about
*how* to romanize, not *whether* to.

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

### Diacritic Folding

**Turkish (tur)** and **Sami (sme)** — fold special characters:
- Turkish: ğ→g, ı→i, ş→s, ç→c, ö→o, ü→u
- Sami: č→c, đ→d, ŋ→n, š→s, ŧ→t, ž→z

### Plain Latin Script

**English (eng)** and other plain-ASCII names: nothing to convert, so repeat the name
verbatim in `transliteration`. The column is still required and cannot be NULL or empty.

---

## Name Relations

### Relation Types

The full set lives in `src/db/relations.ts` (`NameRelationType`); `pnpm db:validate`
rejects any other value.

| Relation | Meaning | Direction | Same species required? |
|----------|---------|-----------|------------------------|
| `borrowed_from` | Source borrowed from target | source ← target | yes |
| `alternate_of` | Different name for same thing | bidirectional | yes |
| `smaller_than` | Size progression | source < target | yes |
| `confused_with` | Different species, often confused | bidirectional | no (same species warns) |
| `male_of` | Name for male specimens | source → target | yes |
| `female_of` | Name for female specimens | source → target | yes |

Self-references and duplicate `(source_id, target_id, relation)` triples are rejected.

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
