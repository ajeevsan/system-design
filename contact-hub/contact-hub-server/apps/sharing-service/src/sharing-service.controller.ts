import { Controller, Get } from '@nestjs/common';
import { SharingServiceService } from './sharing-service.service.js';

@Controller()
export class SharingServiceController {
  constructor(private readonly sharingServiceService: SharingServiceService) {}

  @Get()
  getHello(): string {
    return this.sharingServiceService.getHello();
  }
}
