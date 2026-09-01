import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FILE_STORAGE } from './domain/storage.service.interface.js';
import { B2S3StorageService } from './infrastructure/b2-s3-storage.service.js';
import { LocalFileStorageService } from './infrastructure/local-file-storage.service.js';

@Module({
  providers: [
    B2S3StorageService,
    LocalFileStorageService,
    {
      provide: FILE_STORAGE,
      useFactory: (config: ConfigService, b2: B2S3StorageService, local: LocalFileStorageService) => {
        const driver = config.get<string>('storage.driver', 'b2');
        const accessKey = config.get<string>('storage.s3.accessKey', '');
        if (driver === 'local' || !accessKey) {
          return local;
        }
        return b2;
      },
      inject: [ConfigService, B2S3StorageService, LocalFileStorageService],
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
