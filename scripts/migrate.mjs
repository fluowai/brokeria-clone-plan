#!/usr/bin/env node
// Simple migration runner: applies db/migrations/*.sql in order, once each.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "..", "db", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new Client({ connectionString: url });

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const { rowCount } = await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [file]);
    if (rowCount) {
      console.log(`↷ skip ${file}`);
      continue;
    }
    const sql = await readFile(resolve(MIGRATIONS_DIR, file), "utf8");
    console.log(`▶ apply ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [file]);
      await client.query("COMMIT");
      console.log(`✓ ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
  await client.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
