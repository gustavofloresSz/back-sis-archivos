import { Tramite } from '../../../tramite/entities/tramite.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clasificacion_tramite')
export class ClasificacionTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  nombre: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;
  
  @OneToMany(
    () => Tramite,
    (tramite: Tramite) => tramite.clasificacion_tramite,
  )
  tramites: Tramite[];
}
