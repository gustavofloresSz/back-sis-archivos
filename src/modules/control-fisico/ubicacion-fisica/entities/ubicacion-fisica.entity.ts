import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EstanteFisico } from '../../estante-fisico/entities/estante-fisico.entity';
import { Tramite } from 'src/modules/gestion-tramites/tramite/entities/tramite.entity';
import { MovimientoFisico } from 'src/modules/control-fisico/movimiento_fisico/entities/movimiento_fisico.entity';


@Entity('ubicacion_fisica')
@Unique(['estante_fisico_id', 'columna', 'fila'])
export class UbicacionFisica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  estante_fisico_id: number;

  @Column({ type: 'varchar', length: 20 })
  columna: string;

  @Column({ type: 'varchar', length: 20 })
  fila: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @ManyToOne(() => EstanteFisico, (estante: EstanteFisico) => estante.ubicaciones_fisicas)
  @JoinColumn({ name: 'estante_fisico_id' })
  estante_fisico: EstanteFisico;

  @OneToMany(() => Tramite, (tramite: Tramite) => tramite.ubicacion_fisica)
  tramites: Tramite[];

  @OneToMany(() => MovimientoFisico, (movimiento: MovimientoFisico) => movimiento.ubicacion_origen)
  movimientos_origen: MovimientoFisico[];

  @OneToMany(() => MovimientoFisico, (movimiento: MovimientoFisico) => movimiento.ubicacion_destino)
  movimientos_destino: MovimientoFisico[];
}
