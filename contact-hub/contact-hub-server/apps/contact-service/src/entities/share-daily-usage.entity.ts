import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('share_daily_usage')
@Index(['employeeId', 'quotaDate'], { unique: true })
export class ShareDailyUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  employeeId: number;

  @Column('varchar')
  quotaDate: string;

  @Column('int', { default: 0 })
  contactsShared: number;
}
