import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn('varchar') tokenHash: string;
  @Column('int') employeeId: number;
  @Column('datetime') expiresAt: Date;
}
