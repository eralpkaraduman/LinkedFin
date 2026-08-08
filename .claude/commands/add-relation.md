# Add Name Relation

Add a relation between two fish names.

## Input
$ARGUMENTS

## Instructions

1. **Parse the input** to extract:
   - Source name or ID (nm_XXXX)
   - Target name or ID (nm_XXXX)
   - Relation type
   - Notes (optional)

2. **Find name IDs** if names given instead of IDs:
   ```sql
   SELECT id, name, lang, species_id FROM names WHERE name LIKE '%keyword%';
   ```

3. **Validate relation type** (must be one of):
   | Relation | Meaning | Direction |
   |----------|---------|-----------|
   | `borrowed_from` | Source borrowed from target | source ← target |
   | `alternate_of` | Different name for same thing | bidirectional |
   | `smaller_than` | Size progression | source < target |
   | `confused_with` | Different species, often confused | bidirectional |

4. **Check same-species constraint**:
   - `borrowed_from`, `alternate_of`, `smaller_than`: MUST be same species
   - `confused_with`: can be different species

   ```sql
   SELECT n1.species_id, n2.species_id
   FROM names n1, names n2
   WHERE n1.id = 'source_id' AND n2.id = 'target_id';
   ```

5. **Check relation doesn't exist**:
   ```sql
   SELECT * FROM name_relations
   WHERE source_id = 'nm_XXXX' AND target_id = 'nm_YYYY' AND relation = 'type';
   ```

6. **Insert the relation**:
   ```sql
   INSERT INTO name_relations (source_id, target_id, relation, notes)
   VALUES ('nm_XXXX', 'nm_YYYY', 'relation_type', 'notes');
   ```

7. **Run validation**:
   ```bash
   pnpm db:validate
   ```

8. **Apply quality control** (see Quality Control section below).

9. **Report** the created relation.

## Quality Control

Before inserting, verify ALL of the following:

- **Relation type correctness**: Choose the right type — `borrowed_from` for linguistic borrowing (not just similarity), `alternate_of` for genuinely different names for the same thing, `confused_with` for different species that are commonly mixed up, `smaller_than` for documented size class progressions.
- **Direction matters for `borrowed_from`**: Source is the borrower, target is the origin. Verify direction with etymological evidence.
- **Same-species constraint**: `borrowed_from`, `alternate_of`, `smaller_than` must link names of the same species. `confused_with` can cross species.
- **Supporting evidence**: Relations must be backed by etymological or documented evidence. Do not add speculative relations.
- **Etymology consistency**: If adding `borrowed_from`, verify the source name's etymology actually documents this borrowing. If not, update the etymology first using /update-name.

## Relation Usage Guide

**borrowed_from** - Linguistic borrowing:
```sql
-- Finnish silakka borrowed from Swedish
INSERT INTO name_relations VALUES ('nm_finnish', 'nm_swedish', 'borrowed_from', 'Finnish from Swedish sill');
```

**alternate_of** - Same species, different names:
- Dialectal variants (Kuore ↔ Norssi)
- Cross-language equivalents (Finnish Ahven ↔ Swedish Abborre)
- Regional variants

**confused_with** - Different species commonly confused:
```sql
-- Rainbow trout often confused with salmon
INSERT INTO name_relations VALUES ('nm_kirjolohi', 'nm_lohi', 'confused_with', 'Both called -lohi');
```

**smaller_than** - Size progression:
```sql
-- Çinekop < Lüfer < Kofana (bluefish size classes)
INSERT INTO name_relations VALUES ('nm_cinekop', 'nm_lufer', 'smaller_than', 'Size progression');
```

## Example Usage
```
/add-relation nm_0470 alternate_of nm_0473 - Finnish name variants
/add-relation Punasimppu borrowed_from Swedish simpa
```
