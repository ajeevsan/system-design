
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  employee_id: number;

  @Column({ nullable: false })
  firstName: string;
  

  @Column({ nullable: false })
  lastName: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: false })
  phone: string;

  @Column({ default: 'EMPLOYEE' })
  role: string;

  @Column({ default: 'ACTIVE' })
  status: string;
}
