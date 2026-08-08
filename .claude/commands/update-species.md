# Update Species

Update an existing species entry in the database.

## Input
$ARGUMENTS

A species ID (sp_XXX), scientific name, or search term.

## Instructions

1. **Find the species**:
   ```sql
   SELECT * FROM species WHERE id = 'sp_XXX' OR scientific_name LIKE '%query%';
   ```

2. **Show current data** — all fields and all names associated with this species:
   ```sql
   SELECT n.id, n.name, n.lang, r.name as region, n.etymology
   FROM names n
   JOIN regions r ON n.region_id = r.id
   WHERE n.species_id = 'sp_XXX'
   ORDER BY n.lang;
   ```

3. **Show existing relations** for all names under this species:
   ```sql
   SELECT n1.name || ' (' || n1.id || ')' as source,
          rel.relation,
          n2.name || ' (' || n2.id || ')' as target,
          rel.notes
   FROM name_relations rel
   JOIN names n1 ON rel.source_id = n1.id
   JOIN names n2 ON rel.target_id = n2.id
   WHERE n1.species_id = 'sp_XXX' OR n2.species_id = 'sp_XXX';
   ```

4. **Research if needed** — verify scientific name, taxonomy, and notes against authoritative sources (FishBase, Wikipedia, academic papers).

5. **Apply quality control** (see Quality Control section below).

6. **Update the species**:
   ```sql
   UPDATE species SET
     scientific_name = 'New name',
     notes = 'Updated notes'
   WHERE id = 'sp_XXX';
   ```

7. **Check cascading impacts** — if the scientific name changed, verify all associated names still make sense. If notes describe the species, ensure the description is factual and concise.

8. **Validate**:
   ```bash
   pnpm db:validate
   ```

9. **Report** what changed (before → after).

## Quality Control

Before saving any update, verify:

- **Notes must describe the species itself** — what kind of animal it is, key characteristics, size, habitat. Do not reference names in specific languages in the notes.
- **Scientific name accuracy** — verify against FishBase or Wikipedia. Use the accepted name, not synonyms.
- **Consistency** — if updating a species, check that all associated names still correctly reference this species. Flag any names that may need reassignment.

## Example Usage
```
/update-species sp_023
/update-species Squatina squatina - fix notes
/update-species Callinectes sapidus
```
