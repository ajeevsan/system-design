import { Controller, Get } from '@nestjs/common';
import { EtlServiceService } from './etl-service.service.js';

@Controller()
export class EtlServiceController {
  constructor(private readonly etlServiceService: EtlServiceService) {}

  @Get()
  getHello(): string {
    return this.etlServiceService.getHello();
  }
}
