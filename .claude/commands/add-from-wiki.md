# Add Fish from Wikipedia

Research a fish from Wikipedia and add species + names to the database.

## Input
$ARGUMENTS

A Wikipedia URL (any language) or fish name to research.

## Instructions

1. **Fetch Wikipedia page** or search for the fish:
   - Extract scientific name
   - Extract common names in various languages
   - Note etymology if mentioned
   - Note habitat (marine/freshwater/brackish)

2. **Research etymology** using web search:
   - Search: `"[name]" etymology [language]`
   - Search: `"[name]" Wiktionary`
   - For compound words, identify components

3. **Check if species exists**:
   ```sql
   SELECT id, scientific_name FROM species WHERE scientific_name LIKE '%name%';
   ```

4. **Add species if new** (see /add-species)

5. **For each name found**, follow AGENTS.md format:

   **Etymology format:**
   - Basic: `From [language] word (meaning)`
   - Compound: `Compound: part1 + part2\npart1: meaning, part2: meaning`
   - Derivation: Use `↳` for borrowed/derived words

   **Required fields by language:**
   | Language | transliteration | phonetic |
   |----------|-----------------|----------|
   | Arabic (arb/arz/apc) | REQUIRED | recommended |
   | Greek (ell) | REQUIRED | recommended |
   | Finnish (fin) | REQUIRED | REQUIRED |
   | Swedish (swe) | REQUIRED | REQUIRED |
   | Estonian (est) | REQUIRED | REQUIRED |
   | English (eng) | not needed | optional |

6. **Add names** using appropriate IDs:
   ```sql
   SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM names;
   ```

7. **Add relations** between names:
   - Same species, different languages: `alternate_of`
   - Borrowed words: `borrowed_from`
   - Dialectal variants: `alternate_of`

8. **Validate**:
   ```bash
   pnpm db:copy && pnpm db:validate
   ```

9. **Report** all added entries with IDs.

## Example Usage
```
/add-from-wiki https://fi.wikipedia.org/wiki/Punasimppu
/add-from-wiki Atlantic cod
/add-from-wiki Gadus morhua
```
