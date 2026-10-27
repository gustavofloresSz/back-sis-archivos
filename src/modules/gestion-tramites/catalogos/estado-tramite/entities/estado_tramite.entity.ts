import { Tramite } from '../../../tramite/entities/tramite.entity';
import { HistorialEstadoTramite } from '../../../workflow/historial-estado/entities/historial_estado_tramite.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('estado_tramite')
export class EstadoTramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: false })
  es_final: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => Tramite, (tramite: Tramite) => tramite.estado_actual)
  tramites_actuales: Tramite[];

  @OneToMany(
    () => HistorialEstadoTramite,
    (historial: HistorialEstadoTramite) => historial.estado_anterior,
  )
  historiales_como_anterior: HistorialEstadoTramite[];
  
  @OneToMany(
    () => HistorialEstadoTramite,
    (historial: HistorialEstadoTramite) => historial.estado_nuevo,
  )
  historiales_como_nuevo: HistorialEstadoTramite[];
}
