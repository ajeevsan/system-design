import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class UserServiceService {
  constructor(
    @InjectRepository(Employee) 
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      service: 'user-service',
      status: 'ok',
    };
  }

  adminLogin(email: string, password: string) {
    if(email==='sanjeevmajhi036@gmail.com' && password==='test@123') {
      return {
        success: true,
        message: 'Loign Successful',
        user: {
          id: 1,
          email: email,
          role: 'admin'
        },
      }
    }

    return {
      success: false,
      message: 'invalid credentials',
    }
  }

  employeeLogin(email: string, password: string) {
    if(email==='sanjeevmajhi036@gmail.com' && password==='test@123') {
      return {
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          emai: email,
          role: 'employee'
        }
      }
    }
  }

  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) {
    const employee = this.employeeRepository.create(data);

    return await this.employeeRepository.save(employee);
  }

  async getEmployee() {
    return await this.employeeRepository.find();
  }

  async updateUser(
    employee_id: number,
    data: {
      firstName?: string;
      lastName?: string;
  }) {
    const employee = await this.employeeRepository.findOneBy({
      employee_id,
    })

    if(!employee) {
      throw new NotFoundException(
        `Employee with ${employee_id} not found`
      );
    }

    if(
      data.firstName===undefined &&
      data.lastName === undefined
    ) {
      throw new BadRequestException('Provide atleast one field to update.')
    }

    if(data.firstName) {
      employee.firstName = data.firstName;
    }

    if(data.lastName) {
      employee.lastName = data.lastName;
    }

    return await this.employeeRepository.save(employee);
  }
}
