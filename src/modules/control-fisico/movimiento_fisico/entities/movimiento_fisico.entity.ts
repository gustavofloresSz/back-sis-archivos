import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { Tramite } from '../../../gestion-tramites/tramite/entities/tramite.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UbicacionFisica } from '../../ubicacion-fisica/entities/ubicacion-fisica.entity';

export enum TipoMovimientoFisico {
  RETIRO = 'RETIRO',
  DEVOLUCION = 'DEVOLUCION',
  TRASLADO = 'TRASLADO',
}

@Entity()
export class MovimientoFisico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  tramite_id: number;

  @Column({ type: 'int' })
  usuario_registro_id: number;

  @Column({ type: 'varchar', length: 50 })
  tipo_movimiento: TipoMovimientoFisico;

  @Column({ type: 'int', nullable: true })
  ubicacion_origen_id: number | null;

  @Column({ type: 'int', nullable: true })
  ubicacion_destino_id: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre_persona: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  documento_persona: string | null;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @ManyToOne(
    () => Tramite,
    (tramite: Tramite) => tramite.movimientos_fisicos,
    { nullable: false },
  )
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @ManyToOne(() => Usuario,(usuario: Usuario) => usuario.movimientos_fisicos,{ nullable: false },)
  @JoinColumn({ name: 'usuario_registro_id' })
  usuario_registro: Usuario;

  @ManyToOne(() => UbicacionFisica,(ubicacion: UbicacionFisica) => ubicacion.movimientos_origen,{ nullable: true },)
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacion_origen: UbicacionFisica | null;

  @ManyToOne(() => UbicacionFisica,(ubicacion: UbicacionFisica) => ubicacion.movimientos_destino,{ nullable: true },)
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacion_destino: UbicacionFisica | null;

  @CreateDateColumn({ name: 'fecha_movimiento' })
  fecha_movimiento: Date;
}
