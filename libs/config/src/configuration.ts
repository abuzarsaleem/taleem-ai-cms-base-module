export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Taleem AI Base Module',
    port: parseInt(process.env.APP_PORT ?? '3000', 10),
    prefix: process.env.API_PREFIX ?? 'api/v1',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'postgres',
    schema: process.env.DATABASE_SCHEMA ?? 'taleem-ai-base',
    ssl: process.env.DATABASE_SSL !== 'false',
    logging: process.env.DATABASE_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret-min-32-chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret-min-32-chars',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  auth: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
    authorizationCodeTtlSeconds: parseInt(
      process.env.OAUTH_AUTHORIZATION_CODE_TTL_SECONDS ?? '300',
      10,
    ),
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'b2',
    localPath: process.env.LOCAL_STORAGE_PATH ?? 'data/files',
    upload: {
      maxImageBytes: parseInt(process.env.UPLOAD_MAX_IMAGE_BYTES ?? '5242880', 10),
      maxDocumentBytes: parseInt(process.env.UPLOAD_MAX_DOCUMENT_BYTES ?? '10485760', 10),
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? 'https://s3.us-east-005.backblazeb2.com',
      region: process.env.S3_REGION ?? 'us-east-005',
      accessKey: process.env.S3_ACCESS_KEY ?? '',
      secretKey: process.env.S3_SECRET_KEY ?? '',
      bucket: process.env.S3_BUCKET ?? 'taleem-cms-base-module',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      signedUrls: process.env.S3_SIGNED_URLS !== 'false',
      signedUrlTtlSeconds: parseInt(process.env.S3_SIGNED_URL_TTL_SECONDS ?? '604800', 10),
      publicUrl: process.env.S3_PUBLIC_URL ?? 'https://f005.backblazeb2.com/file/taleem-cms-base-module',
    },
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY ?? '',
    fromEmail: process.env.BREVO_FROM_EMAIL ?? 'Taleem AI <noreply@taleem.ai>',
  },
  invitation: {
    ttlHours: parseInt(process.env.INVITATION_TTL_HOURS ?? '168', 10),
    acceptUrlBase: process.env.INVITATION_ACCEPT_URL_BASE ?? 'http://localhost:3000/accept-invite',
  },
});
