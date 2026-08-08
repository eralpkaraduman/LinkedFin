# Add Species

Add a new fish species to the database.

## Input
$ARGUMENTS

## Instructions

1. **Parse the input** to extract:
   - Scientific name (required): e.g., "Gadus morhua"
   - Family (optional): e.g., "Gadidae"
   - Habitat: "marine", "freshwater", or "brackish" (default: marine)
   - Notes (optional): description or context

2. **Check if species exists**:
   ```sql
   SELECT id, scientific_name FROM species WHERE scientific_name LIKE '%keyword%';
   ```

3. **Get next available ID**:
   ```sql
   SELECT 'sp_' || printf('%03d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) FROM species;
   ```

4. **Insert the species**:
   ```sql
   INSERT INTO species (id, scientific_name, family, habitat, notes)
   VALUES ('sp_XXX', 'Scientific name', 'Family', 'habitat', 'notes');
   ```

5. **Run validation**:
   ```bash
   pnpm db:validate
   ```

6. **Apply quality control** (see Quality Control section below).

7. **Report** the new species ID and details.

## Quality Control

Before inserting, verify ALL of the following:

- **Scientific name accuracy**: Verify against FishBase or Wikipedia. Use the currently accepted name, not synonyms or outdated classifications.
- **Notes must describe the species itself**: What kind of animal it is, key physical characteristics, size range, habitat. Do not mention names in specific languages.
- **Notes must be informative**: Vague notes like "A type of fish" are not acceptable. Include distinguishing features that help identify the species.
- **No duplicate species**: Verify the species doesn't already exist under a different ID or synonym.

## Example Usage
```
/add-species Sebastes mentella, Sebastidae, marine, Norway redfish
```
