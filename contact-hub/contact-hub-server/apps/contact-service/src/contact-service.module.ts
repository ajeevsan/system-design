import { Module } from '@nestjs/common';
import { ContactServiceController } from './contact-service.controller.js';
import { ContactServiceService } from './contact-service.service.js';

@Module({
  imports: [],
  controllers: [ContactServiceController],
  providers: [ContactServiceService],
})
export class ContactServiceModule {}
