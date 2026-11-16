import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity.js';
import { ShareDailyUsage } from './entities/share-daily-usage.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'contacts',
      type: 'sqlite',
      database: 'data/contacts.sqlite',
      entities: [Contact, ShareDailyUsage],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Contact, ShareDailyUsage], 'contacts'),
  ],
  exports: [TypeOrmModule],
})
export class ContactsDatabaseModule {}
