var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (config) => {
                    const schema = config.get('database.schema');
                    const ssl = config.get('database.ssl')
                        ? { rejectUnauthorized: false }
                        : false;
                    const url = config.get('database.url');
                    const common = {
                        type: 'postgres',
                        schema,
                        ssl,
                        logging: config.get('database.logging'),
                        autoLoadEntities: true,
                        synchronize: false,
                    };
                    if (url) {
                        return { ...common, url };
                    }
                    return {
                        ...common,
                        host: config.get('database.host'),
                        port: config.get('database.port'),
                        username: config.get('database.username'),
                        password: config.get('database.password'),
                        database: config.get('database.database'),
                    };
                },
            }),
        ],
    })
], DatabaseModule);
export { DatabaseModule };
//# sourceMappingURL=database.module.js.map