import { Controller, Get, Query } from '@nestjs/common';
import { ShareUsageServiceService } from './share-usage-service.service.js';

@Controller('share-usage')
export class ShareUsageServiceController {
  constructor(
    private readonly shareUsageServiceService: ShareUsageServiceService,
  ) {}

  @Get()
  getUsage(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.shareUsageServiceService.getUsage(employeeId, from, to);
  }
}
