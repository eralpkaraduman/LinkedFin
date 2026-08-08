# Update Name Relation

Update or delete an existing relation between two fish names.

## Input
$ARGUMENTS

Source ID, target ID, and relation type to identify the relation; or a name/ID to find all its relations.

## Instructions

1. **Find the relation(s)**:
   ```sql
   -- By specific relation
   SELECT n1.name || ' (' || rel.source_id || ')' as source,
          rel.relation,
          n2.name || ' (' || rel.target_id || ')' as target,
          rel.notes
   FROM name_relations rel
   JOIN names n1 ON rel.source_id = n1.id
   JOIN names n2 ON rel.target_id = n2.id
   WHERE rel.source_id = 'nm_XXXX' OR rel.target_id = 'nm_XXXX';
   ```

2. **Show current data** — the relation and both names with their full details (etymology, lang, species).

3. **Determine action**:
   - **Update notes**: Modify the relation's notes
   - **Change relation type**: Delete old, insert new (relation type is part of the primary key)
   - **Delete**: Remove an incorrect relation
   - **Reverse direction**: For `borrowed_from`, direction matters — swap source/target if wrong

4. **Apply quality control** (see Quality Control section below).

5. **Execute the change, then stamp both endpoint names' `updated_at` — every path below ends with the same `UPDATE names` line**:
   ```sql
   -- Update notes
   UPDATE name_relations SET notes = 'new notes'
   WHERE source_id = 'nm_XXXX' AND target_id = 'nm_YYYY' AND relation = 'type';

   UPDATE names SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
   WHERE id IN ('nm_XXXX', 'nm_YYYY');

   -- Change type (delete + re-insert)
   DELETE FROM name_relations
   WHERE source_id = 'nm_XXXX' AND target_id = 'nm_YYYY' AND relation = 'old_type';

   INSERT INTO name_relations (source_id, target_id, relation, notes)
   VALUES ('nm_XXXX', 'nm_YYYY', 'new_type', 'notes');

   UPDATE names SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
   WHERE id IN ('nm_XXXX', 'nm_YYYY');

   -- Delete
   DELETE FROM name_relations
   WHERE source_id = 'nm_XXXX' AND target_id = 'nm_YYYY' AND relation = 'type';

   UPDATE names SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
   WHERE id IN ('nm_XXXX', 'nm_YYYY');
   ```

   `name_relations` has no `updated_at` column of its own (by design — see AGENTS.md
   Schema Reference). Every one of the three actions above — note edit, type change, or
   delete — changes what renders on both endpoints' `/name/$id` pages, so every path
   must stamp both `names` rows. Do not skip the `UPDATE names` after a delete: removing
   a relation changes the page just as much as adding one.

6. **Validate**:
   ```bash
   pnpm db:validate
   ```

7. **Report** the change.

## Quality Control

Before saving any update, verify:

- **Relation type correctness**: `borrowed_from` = linguistic borrowing (source borrowed from target), `alternate_of` = same species different name, `confused_with` = different species often mixed up, `smaller_than` = size class progression.
- **Direction matters for `borrowed_from`**: The source is the borrower, target is the origin. Verify the borrowing direction with etymological sources.
- **Same-species constraint**: `borrowed_from`, `alternate_of`, `smaller_than` must link names of the same species. `confused_with` can cross species.
- **Supporting evidence**: Relations should be backed by etymological evidence. If adding `borrowed_from`, the borrowing should be documented in the source name's etymology.

## Example Usage
```
/update-relation nm_0455 - fix incorrect Greek origin
/update-relation nm_0019 nm_0020 smaller_than - update notes
```
