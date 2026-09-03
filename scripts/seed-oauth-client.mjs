import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

const schema = process.env.DATABASE_SCHEMA ?? 'taleem-ai-base';
const schemaRef = `"${schema}"`;

const appCode = process.env.OAUTH_SEED_APP_CODE ?? 'ALUMNI';
const clientId = process.env.OAUTH_SEED_CLIENT_ID ?? 'alumni-web';
const clientSecret = process.env.OAUTH_SEED_CLIENT_SECRET ?? 'AlumniClientSecret2026!';
const redirectUri = process.env.OAUTH_SEED_REDIRECT_URI ?? 'http://localhost:3001/callback';
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

function buildClientConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : undefined,
    };
  }
  return {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME ?? 'postgres',
    ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : undefined,
  };
}

async function run() {
  const client = new pg.Client(buildClientConfig());
  await client.connect();

  try {
    await client.query('BEGIN');

    const appResult = await client.query(
      `
      INSERT INTO ${schemaRef}.applications (application_code, name, description, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      ON CONFLICT (application_code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = 'ACTIVE',
        updated_at = now()
      RETURNING id, application_code, name
      `,
      [appCode, 'Alumni Portal', 'Taleem Alumni application (seed)'],
    );
    const app = appResult.rows[0];

    const scopes = [
      ['openid', 'OpenID Connect', 'OpenID Connect identity scope'],
      ['profile', 'Profile', 'Basic profile information'],
      ['tenant.read', 'Tenant Read', 'Read tenant context'],
    ];

    for (const [code, name, description] of scopes) {
      await client.query(
        `
        INSERT INTO ${schemaRef}.application_scopes (application_id, scope_code, name, description, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (application_id, scope_code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = TRUE
        `,
        [app.id, code, name, description],
      );
    }

    const secretHash = await bcrypt.hash(clientSecret, saltRounds);
    const clientResult = await client.query(
      `
      INSERT INTO ${schemaRef}.oauth_clients (
        application_id, client_id, client_name, client_type, client_secret_hash, status, redirect_uris
      )
      VALUES ($1, $2, $3, 'CONFIDENTIAL', $4, 'ACTIVE', $5::jsonb)
      ON CONFLICT (client_id) DO UPDATE SET
        application_id = EXCLUDED.application_id,
        client_name = EXCLUDED.client_name,
        client_type = EXCLUDED.client_type,
        client_secret_hash = EXCLUDED.client_secret_hash,
        status = 'ACTIVE',
        redirect_uris = EXCLUDED.redirect_uris,
        updated_at = now()
      RETURNING id, client_id, client_name
      `,
      [app.id, clientId, 'Alumni Web App', secretHash, JSON.stringify([redirectUri])],
    );

    await client.query('COMMIT');

    console.log('OAuth client seeded successfully.');
    console.log(`  Application: ${app.application_code} (${app.name})`);
    console.log(`  Client ID:   ${clientResult.rows[0].client_id}`);
    console.log(`  Client Name: ${clientResult.rows[0].client_name}`);
    console.log(`  Redirect:    ${redirectUri}`);
    if (!process.env.OAUTH_SEED_CLIENT_SECRET) {
      console.log(`  Secret:      ${clientSecret} (default — rotate in production)`);
    } else {
      console.log('  Secret:      (from OAUTH_SEED_CLIENT_SECRET env var)');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('OAuth seed failed:', error.message ?? error);
  process.exit(1);
});
