import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const schema = config.get<string>('database.schema');
        const ssl = config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false;
        const url = config.get<string>('database.url');

        const common = {
          type: 'postgres' as const,
          schema,
          ssl,
          logging: config.get<boolean>('database.logging'),
          autoLoadEntities: true,
          synchronize: false,
        };

        if (url) {
          return { ...common, url };
        }

        return {
          ...common,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.database'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
