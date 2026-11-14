import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadServiceController } from './upload-service.controller.js';
import { UploadServiceService } from './upload-service.service.js';
import { Upload } from './entities/upload.entity.js';
import { UploadQuota } from './entities/upload-quota.entity.js';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/uploads.sqlite',
      entities: [Upload],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Upload]),
  ],
  controllers: [UploadServiceController],
  providers: [UploadServiceService],
})
export class UploadServiceModule {}
