import { Module } from '@nestjs/common';
import { UploadServiceController } from './upload-service.controller.js';
import { UploadServiceService } from './upload-service.service.js';

@Module({
  imports: [],
  controllers: [UploadServiceController],
  providers: [UploadServiceService],
})
export class UploadServiceModule {}
