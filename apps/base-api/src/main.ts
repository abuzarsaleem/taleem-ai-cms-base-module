import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const prefix = config.get<string>('app.prefix', 'api/v1');

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
    .addTag('Tenants', 'Tenant lifecycle and onboarding')
    .addTag('Institution Profile', 'Institution profile per tenant')
    .addTag('Tenant Contacts', 'Tenant contact persons')
    .addTag('Tenant Addresses', 'Tenant physical addresses')
    .addTag('Tenant Identifiers', 'Registration and accreditation identifiers')
    .addTag('Tenant Configuration', 'Locale, timezone, currency settings')
    .addTag('Tenant SMTP', 'Outbound email configuration')
    .addTag('Tenant Assets', 'Logos, banners, documents')
    .addTag('Tenant Branding', 'Visual identity and email branding')
    .addTag('Tenant Admin Invitations', 'Invite and manage tenant administrators')
    .addTag('Auth', 'Registration, login, and invitation acceptance')
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
