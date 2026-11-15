import { Module } from '@nestjs/common';
import { ShareUsageServiceController } from './share-usage-service.controller.js';
import { ShareUsageServiceService } from './share-usage-service.service.js';

@Module({
  imports: [],
  controllers: [ShareUsageServiceController],
  providers: [ShareUsageServiceService],
})
export class ShareUsageServiceModule {}
