import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    description: string;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}