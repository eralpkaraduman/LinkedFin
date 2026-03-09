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
   pnpm db:copy && pnpm db:validate
   ```

6. **Report** the new species ID and details.

## Example Usage
```
/add-species Sebastes mentella, Sebastidae, marine, Norway redfish
```
