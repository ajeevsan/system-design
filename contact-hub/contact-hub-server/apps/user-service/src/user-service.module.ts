
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserServiceController } from './user-service.controller.js';
import { UserServiceService } from './user-service.service.js';
import { Employee } from './entities/employee.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/users.sqlite',
      entities: [Employee],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([Employee]),
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
