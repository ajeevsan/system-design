import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn
} from 'typeorm';

export enum UploadStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS',
    FAILED = 'FAILED',
    QUEUE_FAILED = 'QUEUE_FAILED',
}

@Entity('uplods')
export class Upload {
    @PrimaryColumn('varchar')
    id: string;

    @Column('int')
    employeeId: number;

    @Column()
    originalFileName: string;

    @Column()
    storedFilePath: string;

    @Column()
    fileSize: number;

    @Column({
        type: 'simple-enum',
        enum: UploadStatus,
        default: UploadStatus.PENDING
    })
    status: UploadStatus;

    @Column('int', { default: 0})
    totalRows: number;

    @Column('int', { default: 0})
    succesfulRows: number;

    @Column('int', { default: 0})
    failedRows: number;

    @Column('int', { nullable: true})
    errorMeassage: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column('datetime', { nullable: true })
    completedAt: Date | null;
}