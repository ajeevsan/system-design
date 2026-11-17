
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  employee_id: number;

  @Column({ type: 'varchar', nullable: false })
  firstName: string;
  

  @Column({ type: 'varchar', nullable: false })
  lastName: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  phone: string;

  @Column({ type: 'text', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ type: 'varchar', default: 'EMPLOYEE' })
  role: string;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string;
}
