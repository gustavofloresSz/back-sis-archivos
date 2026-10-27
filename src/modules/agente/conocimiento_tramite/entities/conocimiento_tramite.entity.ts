import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ConocimientoTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  requisitos: string;

  @Column({ default: true })
  estado: boolean;
}