import { Controller, Get } from '@nestjs/common';
import { ShareUsageServiceService } from './share-usage-service.service.js';

@Controller()
export class ShareUsageServiceController {
  constructor(private readonly shareUsageServiceService: ShareUsageServiceService) {}

  @Get()
  getHello(): string {
    return this.shareUsageServiceService.getHello();
  }
}
