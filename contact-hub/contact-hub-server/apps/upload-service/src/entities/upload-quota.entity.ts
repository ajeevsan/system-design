import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index
} from 'typeorm';

@Entity('upload_quotas')
@Index(['employeeId', 'quotaDate'], { unique: true})
export class UploadQuota {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('int')
    employeeId: number;

    @Column()
    quotaDate: string;

    @Column('int', { default: 0 })
    uploadCount: number;
}