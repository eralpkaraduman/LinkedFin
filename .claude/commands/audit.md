# Audit Database Quality

Scan the database for quality issues and report problems.

## Input
$ARGUMENTS

Optional scope: "all", a region_id, a language code, a species_id, or a specific check name.

## Instructions

Run the applicable checks below. For each issue found, report: the ID, current value, and what's wrong.

### Check 1: Empty or Missing Etymologies
```sql
SELECT n.id, n.name, n.lang, n.etymology, s.scientific_name
FROM names n
JOIN species s ON n.species_id = s.id
WHERE n.etymology = '' OR n.etymology IS NULL;
```

### Check 2: Unexplained Foreign Words in Etymologies
Scan all etymologies for patterns like "from [Language] word" where the word's meaning is not explained in parentheses. Every foreign word must have its meaning included.

```sql
SELECT n.id, n.name, n.etymology
FROM names n
WHERE n.etymology LIKE '%from %'
  AND n.etymology NOT LIKE '%(%)%';
```

Then manually review remaining etymologies for foreign words without explanations.

### Check 3: Incomplete Borrowing Chains
For etymologies with `↳`, verify each step in the chain explains the word meaning. Flag chains that stop short — e.g., "From Arabic X ↳ from Greek Y" where Y's meaning is not given.

### Check 4: Missing Transliterations
```sql
SELECT n.id, n.name, n.lang
FROM names n
WHERE (n.lang IN ('ell', 'arb', 'arz', 'apc', 'fin', 'swe', 'est'))
  AND (n.transliteration = '' OR n.transliteration IS NULL);
```

### Check 5: Missing Phonetics (Required Languages)
```sql
SELECT n.id, n.name, n.lang
FROM names n
WHERE n.lang IN ('fin', 'swe', 'est')
  AND (n.phonetic = '' OR n.phonetic IS NULL);
```

### Check 6: Species Notes Quality
Check species notes: should describe what the species is (type of animal, key characteristics), not reference language-specific names.

```sql
SELECT id, scientific_name, notes FROM species WHERE notes != '' AND notes IS NOT NULL;
```

Flag notes that:
- Mention names in specific languages (e.g., "Turkish name is...")
- Don't describe the species itself
- Are too vague to be useful

### Check 7: Missing Relations for Borrowings
Find etymologies that mention borrowing ("from [Language]") but have no corresponding `borrowed_from` relation:

```sql
SELECT n.id, n.name, n.etymology
FROM names n
WHERE n.etymology LIKE '%↳%'
  AND n.id NOT IN (
    SELECT source_id FROM name_relations WHERE relation = 'borrowed_from'
  );
```

### Check 8: Orphaned or Incorrect Species Assignments
Look for names whose etymology or common knowledge suggests they refer to a different species than assigned.

### Check 9: Duplicate Names
```sql
SELECT name, species_id, lang, COUNT(*) as cnt
FROM names
GROUP BY name, species_id, lang
HAVING cnt > 1;
```

### Check 10: Relation Consistency
```sql
-- borrowed_from/alternate_of/smaller_than should be same species
SELECT rel.*, n1.species_id as src_species, n2.species_id as tgt_species
FROM name_relations rel
JOIN names n1 ON rel.source_id = n1.id
JOIN names n2 ON rel.target_id = n2.id
WHERE rel.relation IN ('borrowed_from', 'alternate_of', 'smaller_than')
  AND n1.species_id != n2.species_id;
```

## Output

Group results by severity:
1. **Errors** — data that is wrong or violates constraints
2. **Warnings** — data that is incomplete or likely wrong
3. **Suggestions** — opportunities to improve quality (missing relations, incomplete chains)

For each issue, suggest the fix and which skill to use (/update-name, /update-species, /update-relation, /add-relation).

## Example Usage
```
/audit all
/audit fin
/audit sp_023
/audit etymologies
```
