/**
 * Create Trekker tasks for etymology format audit
 *
 * Creates one task per name record to verify etymology format compliance.
 * Run: bun maintenance/scripts/create-etymology-audit-tasks.ts
 */

import Database from "better-sqlite3";

const fishDb = new Database("public/fish.db", { readonly: true });
const trekkerDb = new Database(".trekker/trekker.db");

const PROJECT_ID = "246adf02-c89d-4d52-9cf7-165e84bdcc78";
const EPIC_ID = "EPIC-6";

const FORMAT_INSTRUCTIONS = `**Expected Etymology Format (from AGENTS.md):**

1. **Basic:** \`From [language] word (meaning)\`
   - Example: \`From Turkish yaprak (leaf)\`
   - Example: \`From Greek σαρδέλα sardéla (pilchard)\`

2. **Compound names:**
   \`\`\`
   Compound: part1 + part2
   part1: meaning, part2: meaning
   \`\`\`

3. **Derivation chains:** Use \`↳\` on new lines
   \`\`\`
   From Greek σαρδέλα sardéla (pilchard)
   ↳ From Latin sardina (Sardinia)
   \`\`\`

4. **Rules:**
   - Meaning in parentheses: \`word (meaning)\` NOT \`word = meaning\`
   - No quotes around meaning: \`(tooth)\` NOT \`("tooth")\`
   - Include transliteration for non-Latin scripts
   - Context/cultural info goes in notes field, not etymology

**Instructions:**
- If format is correct → mark task completed
- If format needs fixing → add comment describing issue, leave open
- If borrowing relation discovered → add comment with: source_id, target_id, relation type`;

// Get all names from fish.db
const names = fishDb.prepare(`
  SELECT n.id, n.name, n.lang, n.etymology, s.scientific_name
  FROM names n
  JOIN species s ON n.species_id = s.id
  ORDER BY n.id
`).all() as { id: string; name: string; lang: string; etymology: string; scientific_name: string }[];

console.log(`Found ${names.length} names to create tasks for...`);

// Get current max task ID
const maxIdResult = trekkerDb.prepare("SELECT MAX(CAST(SUBSTR(id, 6) AS INTEGER)) as max_id FROM tasks").get() as { max_id: number };
let nextId = (maxIdResult.max_id || 89) + 1;

const now = Date.now();

const insertTask = trekkerDb.prepare(`
  INSERT INTO tasks (id, project_id, epic_id, parent_task_id, title, description, priority, status, tags, created_at, updated_at)
  VALUES (?, ?, ?, NULL, ?, ?, 4, 'todo', ?, ?, ?)
`);

const insertMany = trekkerDb.transaction((names: typeof names[0][]) => {
  for (const name of names) {
    const taskId = `TREK-${nextId++}`;
    const title = `[${name.id}] ${name.name} - etymology audit`;
    const description = `**Name:** ${name.name}
**ID:** ${name.id}
**Language:** ${name.lang}
**Species:** ${name.scientific_name}

**Current Etymology:**
\`\`\`
${name.etymology || "(empty)"}
\`\`\`

${FORMAT_INSTRUCTIONS}`;
    const tags = `etymology-audit,${name.lang}`;

    insertTask.run(taskId, PROJECT_ID, EPIC_ID, title, description, tags, now, now);
  }
});

insertMany(names);

console.log(`Created ${names.length} tasks (TREK-90 to TREK-${nextId - 1})`);
console.log(`All tasks assigned to EPIC-6 (Etymology Format Audit)`);

fishDb.close();
trekkerDb.close();
