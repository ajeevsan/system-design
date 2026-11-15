import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contacts')
@Index(['uploadId', 'worksheetId', 'sourceRow'], { unique: true })
@Index(['employeeId'])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  uploadId: string;

  @Column('int')
  employeeId: number;

  @Column('int')
  worksheetId: number;

  @Column('int')
  sourceRow: number;

  @Column('text')
  name: string;

  @Column('text')
  email: string;

  @Column('text')
  phone: string;

  @Column('text')
  interest: string;

  @CreateDateColumn()
  createdAt: Date;
}
