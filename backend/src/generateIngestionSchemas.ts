import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as z from "zod";

const SCHEMAS_DIR = resolve("./src/ingestionSchemas");
const OUT_DIR = resolve("./schemas");

for (const file of readdirSync(SCHEMAS_DIR)) {
  const modulePath = join(SCHEMAS_DIR, file);

  const mod = require(modulePath);

  if (!mod.fileName) {
    console.warn(`⚠ Skipping ${file}: no exported fileName`);
    continue;
  }

  const schema: z.ZodTypeAny = mod.default;

  if (!schema) {
    console.warn(`⚠ Skipping ${file}: no exported schema`);
    continue;
  }

  const jsonSchema = z.toJSONSchema(schema, {
    target: "draft-07",
  });

  const outFile = join(OUT_DIR, mod.fileName);

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(jsonSchema, null, 2)}\n`);

  console.log(`✓ Generated ${outFile}`);
}
