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

    const existing = await client.query(
      `
      SELECT identity_id FROM ${schemaRef}.identity_identifiers
      WHERE identifier_type = 'EMAIL' AND identifier_value = $1
      `,
      [email],
    );

    let identityId = existing.rows[0]?.identity_id;

    if (identityId) {
      await client.query(
        `UPDATE ${schemaRef}.identities SET status = 'ACTIVE', updated_at = now() WHERE id = $1`,
        [identityId],
      );
    } else {
      const inserted = await client.query(
        `
        INSERT INTO ${schemaRef}.identities (identity_type, status)
        VALUES ('PERSON', 'ACTIVE')
        RETURNING id
        `,
      );
      identityId = inserted.rows[0].id;

      await client.query(
        `
        INSERT INTO ${schemaRef}.identity_identifiers (
          identity_id, identifier_type, identifier_value, is_primary, is_verified
        )
        VALUES ($1, 'EMAIL', $2, TRUE, TRUE)
        `,
        [identityId, email],
      );
    }

    await client.query(
      `
      INSERT INTO ${schemaRef}.identity_profiles (identity_id, display_name)
      VALUES ($1, $2)
      ON CONFLICT (identity_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = now()
      `,
      [identityId, fullName],
    );

    await client.query(
      `
      INSERT INTO ${schemaRef}.identity_credentials (
        identity_id, credential_type, credential_reference, status
      )
      VALUES ($1, 'PASSWORD', $2, 'ACTIVE')
      ON CONFLICT (identity_id, credential_type) DO UPDATE SET
        credential_reference = EXCLUDED.credential_reference,
        status = 'ACTIVE',
        updated_at = now()
      `,
      [identityId, passwordHash],
    );

    await client.query(
      `
      INSERT INTO ${schemaRef}.authentication_methods (
        identity_id, method_type, status, metadata
      )
      VALUES ($1, 'PASSWORD', 'ACTIVE', jsonb_build_object('identifier', $2::TEXT))
      ON CONFLICT (identity_id, method_type) DO NOTHING
      `,
      [identityId, email],
    );

    const roleResult = await client.query(
      `SELECT id FROM ${schemaRef}.roles WHERE role_code = 'PLATFORM_ADMIN'`,
    );
    if (roleResult.rowCount === 0) {
      throw new Error('PLATFORM_ADMIN role not found — run migrations first');
    }

    const roleId = roleResult.rows[0].id;

    await client.query(
      `
      INSERT INTO ${schemaRef}.identity_roles (identity_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (identity_id, role_id) DO NOTHING
      `,
      [identityId, roleId],
    );

    await client.query('COMMIT');

    console.log('Platform admin seeded successfully.');
    console.log(`  Email:       ${email}`);
    console.log(`  Name:        ${fullName}`);
    console.log(`  Identity ID: ${identityId}`);
    console.log(`  Role:        PLATFORM_ADMIN`);
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
