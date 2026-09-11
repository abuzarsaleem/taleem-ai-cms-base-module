import pg from 'pg';
import bcrypt from 'bcrypt';

const schema = process.env.DATABASE_SCHEMA ?? 'taleem-ai-base';
const schemaRef = `"${schema}"`;
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const clients = [
  {
    appCode: 'ALUMNI',
    appName: 'Alumni Portal',
    appDescription: 'Member profile, directory, events, and announcements',
    launchUrl: 'https://taleem-ai-cms.vercel.app',
    clientId: process.env.OAUTH_SEED_CLIENT_ID ?? 'alumni-web',
    clientName: 'Alumni Web App',
    clientSecret: process.env.OAUTH_SEED_CLIENT_SECRET ?? 'AlumniClientSecret2026!',
    redirectUris: (
      process.env.OAUTH_SEED_REDIRECT_URIS ??
      [
        'http://localhost:5173/callback',
        'https://taleem-ai-cms.vercel.app/callback',
        'https://taleem-ai-cms.vercel.app/home',
      ].join(',')
    )
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean),
  },
  {
    appCode: 'ALUMNI_ADMIN',
    appName: 'Alumni Admin Portal',
    appDescription: 'Manage alumni registrations, members, events, and news',
    launchUrl: 'https://taleem-ai-admin.vercel.app',
    clientId: process.env.OAUTH_SEED_ADMIN_CLIENT_ID ?? 'alumni-admin',
    clientName: 'Alumni Admin Web App',
    clientSecret:
      process.env.OAUTH_SEED_ADMIN_CLIENT_SECRET ?? 'AlumniAdminClientSecret2026!',
    redirectUris: (
      process.env.OAUTH_SEED_ADMIN_REDIRECT_URIS ??
      [
        'http://localhost:5174/callback',
        'https://taleem-ai-admin.vercel.app/callback',
      ].join(',')
    )
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean),
  },
];

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

async function seedClient(db, spec) {
  const appResult = await db.query(
    `
    INSERT INTO ${schemaRef}.applications (
      application_code, name, description, status, launch_url
    )
    VALUES ($1, $2, $3, 'ACTIVE', $4)
    ON CONFLICT (application_code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      status = 'ACTIVE',
      launch_url = COALESCE(NULLIF(EXCLUDED.launch_url, ''), ${schemaRef}.applications.launch_url),
      updated_at = now()
    RETURNING id, application_code, name
    `,
    [spec.appCode, spec.appName, spec.appDescription, spec.launchUrl],
  );
  const app = appResult.rows[0];

  const scopes = [
    ['openid', 'OpenID Connect', 'OpenID Connect identity scope'],
    ['profile', 'Profile', 'Basic profile information'],
    ['tenant.read', 'Tenant Read', 'Read tenant context'],
  ];

  for (const [code, name, description] of scopes) {
    await db.query(
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

  const secretHash = await bcrypt.hash(spec.clientSecret, saltRounds);
  const clientResult = await db.query(
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
    [app.id, spec.clientId, spec.clientName, secretHash, JSON.stringify(spec.redirectUris)],
  );

  return { app, client: clientResult.rows[0], secret: spec.clientSecret };
}

async function run() {
  const client = new pg.Client(buildClientConfig());
  await client.connect();

  try {
    await client.query('BEGIN');
    const seeded = [];
    for (const spec of clients) {
      seeded.push(await seedClient(client, spec));
    }
    await client.query('COMMIT');

    console.log('OAuth clients seeded successfully.');
    for (const row of seeded) {
      console.log(`  Application: ${row.app.application_code} (${row.app.name})`);
      console.log(`  Client ID:   ${row.client.client_id}`);
      console.log(`  Redirects:   ${clients.find((c) => c.clientId === row.client.client_id)?.redirectUris.join(', ')}`);
      console.log(`  Secret:      ${row.secret}`);
      console.log('');
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
