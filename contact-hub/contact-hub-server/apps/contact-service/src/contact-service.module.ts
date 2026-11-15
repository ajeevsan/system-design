import { ContactsDatabaseModule } from './contacts-database.module.js';
import { Module } from '@nestjs/common';
import { ContactServiceController } from './contact-service.controller.js';
import { ContactServiceService } from './contact-service.service.js';

@Module({
  imports: [ContactsDatabaseModule],
  controllers: [ContactServiceController],
  providers: [ContactServiceService],
})
export class ContactServiceModule {}
