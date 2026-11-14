import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity('uplods')
export class Upload {
    @PrimaryGeneratedColumn()
    upload_id: number;

    @Column()
    fileName: string;
}