import { Module } from '@nestjs/common';
import { SharingServiceController } from './sharing-service.controller.js';
import { SharingServiceService } from './sharing-service.service.js';

@Module({
  imports: [],
  controllers: [SharingServiceController],
  providers: [SharingServiceService],
})
export class SharingServiceModule {}
