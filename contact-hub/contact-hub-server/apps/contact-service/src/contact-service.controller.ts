import { Controller, Get } from '@nestjs/common';
import { ContactServiceService } from './contact-service.service.js';

@Controller()
export class ContactServiceController {
  constructor(private readonly contactServiceService: ContactServiceService) {}

  @Get()
  getHello(): string {
    return this.contactServiceService.getHello();
  }
}
