
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { UploadServiceController } from './upload-service.controller.js';
import { UploadServiceService } from './upload-service.service.js';
import { UploadQueueService } from './queue/upload-queue.service.js';

import { Upload } from './entities/upload.entity.js';
import { UploadQuota } from './entities/upload-quota.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/uploads.sqlite',
      entities: [Upload, UploadQuota],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([
      Upload,
      UploadQuota,
    ]),

    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'contact-imports',
    }),
  ],

  controllers: [UploadServiceController],

  providers: [
    UploadServiceService,
    UploadQueueService,
  ],
})
export class UploadServiceModule {}
