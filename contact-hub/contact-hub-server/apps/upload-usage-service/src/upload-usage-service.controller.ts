import { Controller, Get } from '@nestjs/common';
import { UploadUsageServiceService } from './upload-usage-service.service.js';

@Controller()
export class UploadUsageServiceController {
  constructor(private readonly uploadUsageServiceService: UploadUsageServiceService) {}

  @Get()
  getHello(): string {
    return this.uploadUsageServiceService.getHello();
  }
}
