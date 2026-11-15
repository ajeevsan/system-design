import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ContactStatus {
  IMPORTING = 'IMPORTING',
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  CONTACTED = 'CONTACTED',
}

@Entity('contacts')
@Index(['uploadId', 'worksheetId', 'sourceRow'], { unique: true })
@Index(['employeeId'])
@Index(['employeeId', 'status', 'id'])
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

  @Column({ type: 'simple-enum', enum: ContactStatus, default: ContactStatus.AVAILABLE })
  status: ContactStatus;

  @Column('varchar', { nullable: true })
  claimToken: string | null;

  @Column('int', { nullable: true })
  claimedByEmployeeId: number | null;

  @Column('datetime', { nullable: true })
  claimedAt: Date | null;

  @Column('datetime', { nullable: true })
  claimExpiresAt: Date | null;

  @Column('int', { nullable: true })
  contactedByEmployeeId: number | null;

  @Column('datetime', { nullable: true })
  contactedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
