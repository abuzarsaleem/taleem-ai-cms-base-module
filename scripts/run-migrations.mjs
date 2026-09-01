import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations', 'sql');
const schema = process.env.DATABASE_SCHEMA ?? 'taleem-ai-base';
const schemaRef = `"${schema}"`;

function buildClientConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'postgres',
    ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : undefined,
  };
}

async function ensureMigrationTable(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaRef}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${schemaRef}.schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT filename FROM ${schemaRef}.schema_migrations ORDER BY id`,
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function run() {
  const client = new pg.Client(buildClientConfig());
  await client.connect();

  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${schemaRef}.schema_migrations (filename) VALUES ($1)`,
          [file],
        );
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All migrations up to date.');
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
