# Add Fish Name

Add a new fish name to the database with proper etymology formatting.

## Input
$ARGUMENTS

## Instructions

1. **Parse the input** to extract:
   - Name (required): the fish name in native script
   - Species: scientific name or species_id
   - Region: region_id (e.g., "finland", "sweden", "turkish-aegean")
   - Language: ISO 639-3 code (e.g., "fin", "swe", "tur", "ell")
   - Etymology: word origin (will be formatted below)
   - Notes (optional)

2. **Research if needed** using web search for:
   - Etymology and word components
   - IPA pronunciation
   - Related names in other languages

3. **Check species exists**:
   ```sql
   SELECT id, scientific_name FROM species WHERE scientific_name LIKE '%keyword%';
   ```
   If not found, use /add-species first.

4. **Get next available ID**:
   ```sql
   SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM names;
   ```

5. **Format etymology** per AGENTS.md:

   **Basic format:**
   ```
   From [language] word (meaning)
   ```

   **Compound names:**
   ```
   Compound: part1 + part2
   part1: meaning, part2: meaning
   ```

   **Derivation chains (use ↳):**
   ```
   From Greek σαρδέλα sardéla (pilchard)
   ↳ From Latin sardina (Sardinia)
   ```

6. **Format transliteration** (REQUIRED for non-Latin scripts):
   - Finnish/Swedish/Estonian: ä→a, ö→o, å→a, õ→o, ü→u
   - Greek: standard romanization with accents
   - Arabic: DIN 31635 with long vowels (ā, ī, ū)
   - Turkish: ğ→g, ı→i, ş→s, ç→c

7. **Format phonetic** as IPA (REQUIRED for fin, swe, est):
   - Enclose in slashes: /ˈpunɑˌsimpːu/

8. **Insert the name**:
   ```sql
   INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
   VALUES ('nm_XXXX', 'Name', 'sp_XXX', 'region', 'lang', 'etymology', 'transliteration', '/IPA/');
   ```

   `measurement_unit`, `measurement_min` and `measurement_max` are optional and nullable
   (size/length data) — leave them out unless you have that data.

9. **Run validation**:
   ```bash
   pnpm db:validate
   ```

10. **Apply quality control** (see Quality Control section below).

11. **Add discovered relations** — if etymology reveals borrowings from other languages, check if those source names exist in the DB and add `borrowed_from` relations. If the name is commonly confused with another species' name, add `confused_with`.

12. **Report** the new name ID and suggest related names to add or relations to create.

## Quality Control

Before inserting, verify ALL of the following:

- **Etymology completeness**: Every foreign word mentioned must include its meaning in parentheses. "From Arabic marjān" is incomplete — must be "From Arabic مرجان marjān (coral)".
- **Borrowing chains must be fully explained**: If a word was borrowed through multiple languages (e.g., Greek → Latin → Arabic → Turkish), every link must explain what the word means in that language using `↳`. Do not leave any foreign word unexplained.
- **Informative content**: The etymology must teach something. "From Turkish" alone is never acceptable — must include the specific word and its meaning.
- **Compound words**: Each component must have its meaning explained. "Compound: X + Y" requires "X: meaning, Y: meaning".
- **Transliteration standards**: Follow AGENTS.md exactly — Greek with accents, Arabic DIN 31635, Nordic character mappings.
- **Discovered relations must be added**: If the etymology shows a borrowing, add the `borrowed_from` relation (don't just document it in etymology). If research reveals the name is a misnomer or commonly confused, add `confused_with`.
- **No circular etymologies**: A word cannot be explained by itself or by a word that traces back to itself.

## Example Usage
```
/add-name Hauki, Esox lucius, finland, fin - pike fish
```
