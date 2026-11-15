import {
    Entity,
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

@Entity('uploads')
export class Upload {
    @PrimaryColumn('varchar')
    id: string;

    @Column('int')
    employeeId: number;

    @Column('varchar')
    originalFileName: string;

    @Column('varchar')
    storedFilePath: string;

    @Column('int')
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

    @Column('text', { nullable: true})
    errorMeassage: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column('datetime', { nullable: true })
    completedAt: Date | null;
}