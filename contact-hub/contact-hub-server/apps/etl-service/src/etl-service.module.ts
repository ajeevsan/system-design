import { ContactsDatabaseModule } from '../../contact-service/src/contacts-database.module.js';
import { Module } from '@nestjs/common';
import { EtlServiceController } from './etl-service.controller.js';
import { EtlServiceService } from './etl-service.service.js';
import { BullModule } from '@nestjs/bullmq';
import { ExcelImportProcessor } from './workers/excel-import.processor.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from '../../upload-service/src/entities/upload.entity.js';

@Module({
  imports: [
    ContactsDatabaseModule,
    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),

    BullModule.registerQueue({
      name: 'contact-imports',
    }),

    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/uploads.sqlite',
      entities: [Upload],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Upload]),
  ],
  controllers: [EtlServiceController],
  providers: [
    EtlServiceService,
    ExcelImportProcessor,
  ],
})
export class EtlServiceModule {}
