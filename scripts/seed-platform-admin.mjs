import pg from 'pg';
import bcrypt from 'bcrypt';

const schema = process.env.DATABASE_SCHEMA ?? 'taleem-ai-base';
const schemaRef = `"${schema}"`;

const email = (process.env.PLATFORM_ADMIN_EMAIL ?? 'abuzarsaleem@gmail.com').toLowerCase();
const fullName = process.env.PLATFORM_ADMIN_NAME ?? 'Abuzar Saleem';
const password = process.env.PLATFORM_ADMIN_PASSWORD ?? 'TaleemAdmin@2026!';
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

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userResult = await client.query(
      `
      INSERT INTO ${schemaRef}.users (email, password_hash, email_verified, full_name, status)
      VALUES ($1, $2, TRUE, $3, 'ACTIVE')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        email_verified = TRUE,
        full_name = EXCLUDED.full_name,
        status = 'ACTIVE',
        updated_at = now()
      RETURNING id, email, full_name
      `,
      [email, passwordHash, fullName],
    );

    const user = userResult.rows[0];

    const identityCheck = await client.query(
      `SELECT id FROM ${schemaRef}.user_identities WHERE user_id = $1 AND provider_type = 'LOCAL'`,
      [user.id],
    );
    if (identityCheck.rowCount === 0) {
      await client.query(
        `
        INSERT INTO ${schemaRef}.user_identities (user_id, provider_type, identifier, is_primary)
        VALUES ($1, 'LOCAL', $2, TRUE)
        `,
        [user.id, email],
      );
    }

    const roleResult = await client.query(
      `SELECT id FROM ${schemaRef}.roles WHERE role_code = 'PLATFORM_ADMIN'`,
    );
    if (roleResult.rowCount === 0) {
      throw new Error('PLATFORM_ADMIN role not found — run migrations first');
    }

    const roleId = roleResult.rows[0].id;

    await client.query(
      `
      INSERT INTO ${schemaRef}.user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [user.id, roleId],
    );

    await client.query('COMMIT');

    console.log('Platform admin seeded successfully.');
    console.log(`  Email:    ${user.email}`);
    console.log(`  Name:     ${user.full_name}`);
    console.log(`  User ID:  ${user.id}`);
    console.log(`  Role:     PLATFORM_ADMIN`);
    if (!process.env.PLATFORM_ADMIN_PASSWORD) {
      console.log(`  Password: ${password} (default — change after first login)`);
    } else {
      console.log('  Password: (from PLATFORM_ADMIN_PASSWORD env var)');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Seed failed:', error.message ?? error);
  process.exit(1);
});
