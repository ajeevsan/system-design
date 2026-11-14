import { Body, Controller, Get, ParseIntPipe, Patch, Post, Param } from '@nestjs/common';
import { UserServiceService } from './user-service.service.js';

@Controller('users')
export class UserServiceController {
  constructor(private readonly userService: UserServiceService) {}

  @Get()
  getHello(): string {
    return this.userService.getHello();
  }

  @Get('health') 
  getHealth() {
    return this.userService.getHealth();
  }

  @Post('login')
  login(
    @Body() body: { email: string, password: string},
  )  {
    return this.userService.adminLogin(
      body.email,
      body.password,
    )
  }

  @Post('employees')
  employees(
    @Body() body: {email: string, password: string},
  ) {
    return this.userService.employeeLogin(
      body.email,
      body.password,
    )
  }

  @Post('employee')
  createEmployee(
    @Body() body: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  ) {
    return this.userService.createEmployee(body);
  }

  @Get('employee') 
  getEmployee() {
    return this.userService.getEmployee();
  }

  @Patch('employee/:id')
  updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      firstName?: string;
      lastName?: string;
    },
  ) {

    return this.userService.updateUser(id, body);
  }
}
