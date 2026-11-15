import { Module } from '@nestjs/common';
import { UploadUsageServiceController } from './upload-usage-service.controller.js';
import { UploadUsageServiceService } from './upload-usage-service.service.js';

@Module({
  imports: [],
  controllers: [UploadUsageServiceController],
  providers: [UploadUsageServiceService],
})
export class UploadUsageServiceModule {}
