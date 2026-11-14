import { Module } from '@nestjs/common';
import { EtlServiceController } from './etl-service.controller.js';
import { EtlServiceService } from './etl-service.service.js';

@Module({
  imports: [],
  controllers: [EtlServiceController],
  providers: [EtlServiceService],
})
export class EtlServiceModule {}
