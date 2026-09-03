import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get<string>('app.prefix', 'api/v1');

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taleem AI Base Module API')
    .setDescription('Platform base module — tenant management, authentication, and IAM')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Tenants', 'Tenant lifecycle')
    .addTag('Tenant Contacts', 'Tenant contact persons')
    .addTag('Tenant Addresses', 'Tenant physical addresses')
    .addTag('Tenant Identifiers', 'Registration and accreditation identifiers')
    .addTag('Tenant Configuration', 'Locale, timezone, currency, and branding settings')
    .addTag('Tenant SMTP', 'Outbound email configuration')
    .addTag('Tenant Assets', 'Logos, banners, documents')
    .addTag('Catalog', 'Departments, designations, and identifier types')
    .addTag('Tenant Admin Invitations', 'Invite and manage tenant administrators')
    .addTag('Tenant Member Invitations', 'Invite regular tenant members')
    .addTag('Tenant Memberships', 'Tenant user memberships')
    .addTag('User Memberships', 'Current user tenant memberships')
    .addTag('Applications', 'Application catalog and tenant application availability')
    .addTag('Tenant Subscriptions', 'Tenant subscription period, type, billing, and applications')
    .addTag('Tenant Entitlements', 'Tenant application entitlement')
    .addTag('Platform Audit', 'Search platform audit events')
    .addTag('OAuth', 'OAuth 2.0 authorization server (PKCE)')
    .addTag('OAuth Clients', 'OAuth client registration')
    .addTag('Auth', 'Registration, login, password reset, and email verification')
    .addTag('User Profile', 'Current user profile and password management')
    .addTag('Platform Users', 'Platform user administration and role assignment')
    .addTag('User Sessions', 'List and revoke active login sessions')
    .addTag('Health', 'Service health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('app.port', 3000);
  await app.listen(port);
  console.log(`Base API: http://localhost:${port}/${prefix}`);
  console.log(`Swagger:  http://localhost:${port}/docs`);
}

await bootstrap();
