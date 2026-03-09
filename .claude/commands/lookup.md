# Lookup Fish Data

Search for existing species, names, or relations in the database.

## Input
$ARGUMENTS

## Instructions

1. **Parse the search query** - can be:
   - Fish name (any language)
   - Scientific name
   - Species ID (sp_XXX)
   - Name ID (nm_XXXX)
   - Language code (fin, swe, tur, etc.)

2. **Search species**:
   ```sql
   SELECT id, scientific_name, family, habitat, notes
   FROM species
   WHERE scientific_name LIKE '%query%' OR id = 'query';
   ```

3. **Search names**:
   ```sql
   SELECT n.id, n.name, n.lang, n.transliteration, s.scientific_name, r.name as region
   FROM names n
   JOIN species s ON n.species_id = s.id
   JOIN regions r ON n.region_id = r.id
   WHERE n.name LIKE '%query%'
      OR n.transliteration LIKE '%query%'
      OR n.id = 'query'
      OR s.scientific_name LIKE '%query%';
   ```

4. **Show relations** for found names:
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

5. **Show all names for a species**:
   ```sql
   SELECT n.id, n.name, n.lang, n.transliteration, r.name as region
   FROM names n
   JOIN regions r ON n.region_id = r.id
   WHERE n.species_id = 'sp_XXX'
   ORDER BY n.lang;
   ```

6. **Report results** in a clear table format.

## Example Usage
```
/lookup salmon
/lookup sp_018
/lookup Punasimppu
/lookup fin (all Finnish names)
```
