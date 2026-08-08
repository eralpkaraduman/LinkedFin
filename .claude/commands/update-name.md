# Update Fish Name

Update an existing fish name entry in the database.

## Input
$ARGUMENTS

A name ID (nm_XXXX), name text, or search term to find the entry to update.

## Instructions

1. **Find the name** in the database:
   ```sql
   SELECT n.id, n.name, n.lang, n.etymology, n.transliteration, n.phonetic,
          n.species_id, s.scientific_name, n.region_id, r.name as region
   FROM names n
   JOIN species s ON n.species_id = s.id
   JOIN regions r ON n.region_id = r.id
   WHERE n.id = 'nm_XXXX' OR n.name LIKE '%query%';
   ```

2. **Show current data** to the user clearly — all fields.

3. **Show existing relations** for this name:
   ```sql
   SELECT n1.name || ' (' || n1.id || ')' as source,
          rel.relation,
          n2.name || ' (' || n2.id || ')' as target,
          rel.notes
   FROM name_relations rel
   JOIN names n1 ON rel.source_id = n1.id
   JOIN names n2 ON rel.target_id = n2.id
   WHERE n1.id = 'nm_XXXX' OR n2.id = 'nm_XXXX';
   ```

4. **Research corrections** using web search if needed:
   - Verify etymology against Wiktionary and academic sources
   - Cross-reference with multiple sources before changing
   - Search for IPA pronunciation if phonetic is missing or wrong

5. **Apply quality control** (see Quality Control section below).

6. **Update the name**:
   ```sql
   UPDATE names SET
     etymology = 'new etymology',
     transliteration = 'new transliteration',
     phonetic = 'new phonetic'
   WHERE id = 'nm_XXXX';
   ```

7. **Check if relations need updating** — if the etymology reveals borrowings or corrections, add/update relations using /add-relation or /update-relation.

8. **Validate**:
   ```bash
   pnpm db:validate
   ```

9. **Report** what changed (before → after) for each modified field.

## Quality Control

Before saving any update, verify:

- **Etymology completeness**: Every foreign word mentioned must include its meaning. If the etymology says "from Arabic X" then X's meaning must be explained. If X itself comes from another language, that chain must also be explained using `↳`.
- **Borrowing chains**: If a word was borrowed through multiple languages (e.g., Greek → Latin → Turkish), every link in the chain must explain what the word means in that language. Do not leave any foreign word unexplained.
- **Informative content**: The etymology must actually explain something useful. "From Turkish" alone is not acceptable — it must say "From Turkish word (meaning)".
- **Transliteration accuracy**: Must follow AGENTS.md standards (Greek accents, Arabic DIN 31635, Nordic character mappings).
- **Discovered relations**: If the research reveals borrowings, misnomers, or confusion with other species, add the appropriate relations (`borrowed_from`, `confused_with`) — do not just note them in etymology.
- **Format compliance**: Follow AGENTS.md etymology format exactly — parentheses for meanings, `↳` for derivation chains, compound format for compound words.

## Example Usage
```
/update-name nm_0359
/update-name Παπαλίνα
/update-name nm_0483 - fix species assignment
```
