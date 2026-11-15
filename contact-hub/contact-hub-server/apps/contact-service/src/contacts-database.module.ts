import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'contacts',
      type: 'sqlite',
      database: 'data/contacts.sqlite',
      entities: [Contact],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Contact], 'contacts'),
  ],
  exports: [TypeOrmModule],
})
export class ContactsDatabaseModule {}
