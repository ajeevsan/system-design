import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareUsageServiceController } from './share-usage-service.controller.js';
import { ShareUsageServiceService } from './share-usage-service.service.js';
import { ShareDailyUsage } from '../../contact-service/src/entities/share-daily-usage.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/contacts.sqlite',
      entities: [ShareDailyUsage],
      synchronize: true,
    }),
  ],
  controllers: [ShareUsageServiceController],
  providers: [ShareUsageServiceService],
})
export class ShareUsageServiceModule {}
