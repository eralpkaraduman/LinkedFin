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
   INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
   VALUES ('nm_XXXX', 'Name', 'sp_XXX', 'region', 'lang', 'etymology', 'transliteration', '/IPA/', 'notes');
   ```

9. **Run validation**:
   ```bash
   pnpm db:copy && pnpm db:validate
   ```

10. **Report** the new name ID and suggest related names to add or relations to create.

## Example Usage
```
/add-name Hauki, Esox lucius, finland, fin - pike fish
```
