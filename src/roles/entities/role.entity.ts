import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ default: '' })
    description: string;

    @Column({ default: true })
    isActive: boolean;
    
    // JSONB column storing permission map, e.g. { "organizations": ["read","update"], ... }
    @Column({ type: 'json', nullable: true })
    permissions: Record<string, string[]> | null;
}