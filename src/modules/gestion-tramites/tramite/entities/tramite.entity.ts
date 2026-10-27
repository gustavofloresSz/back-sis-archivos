import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { Archivo } from '../../documentos/archivo/entities/archivo.entity';
import { TipoTramite } from '../../catalogos/tipo-tramite/entities/tipo_tramite.entity';
import { ClasificacionTramite } from '../../catalogos/clasificacion-tramite/entities/clasificacion_tramite.entity';
import { EstadoTramite } from '../../catalogos/estado-tramite/entities/estado_tramite.entity';
import { ComprobantePago } from '../../documentos/comprobante-pago/entities/comprobante_pago.entity';
import { HistorialEstadoTramite } from '../../workflow/historial-estado/entities/historial_estado_tramite.entity';
import { MovimientoFisico } from '../../../control-fisico/movimiento_fisico/entities/movimiento_fisico.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UbicacionFisica } from '../../../control-fisico/ubicacion-fisica/entities/ubicacion-fisica.entity';

@Entity()
export class Tramite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  num_folder: number;

  @Column({ type: 'int' })
  num_tramite: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  codigo_tramite: string;

  @Column({ type: 'int' })
  gestion: number;

  @Column({ type: 'varchar', length: 250 })
  nombres_apellidos: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  matricula: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  zona: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  distrito: string | null;

  @Column({ type: 'decimal', nullable: true })
  sup_avance: number | null;

  @Column({ type: 'decimal', nullable: true })
  sup_aprobada: number | null;

  @Column({ type: 'decimal', nullable: true })
  sup_construida: number | null;

  @Column({ type: 'decimal', nullable: true })
  sup_afectada: number | null;

  @Column({ type: 'decimal', nullable: true })
  sup_area_verde: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codigo_catastral: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  resolucion_municipal: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_resolucion: string | null;

  @Column({ type: 'varchar',nullable: true,})
  resolucion_complementaria_aclaratoria: string | null;

  @Column({type: 'date',nullable: true,})
  fecha_resolucion_complementaria_aclaratoria: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'int' })
  tipo_tramite_id: number;

  @ManyToOne(() => TipoTramite, (tipo: TipoTramite) => tipo.tramites, { nullable: false })
  @JoinColumn({ name: 'tipo_tramite_id' })
  tipo_tramite: TipoTramite;

  @Column({ type: 'int' })
  clasificacion_tramite_id: number;

  @ManyToOne(() => ClasificacionTramite, (clasificacion: ClasificacionTramite) => clasificacion.tramites, { nullable: false })
  @JoinColumn({ name: 'clasificacion_tramite_id' })
  clasificacion_tramite: ClasificacionTramite;

  @Column({ type: 'int' })
  usuario_registro_id: number;

  @ManyToOne(() => Usuario, (usuario: Usuario) => usuario.tramites_registrados, { nullable: false })
  @JoinColumn({ name: 'usuario_registro_id' })
  usuario_registro: Usuario;

  @Column({ type: 'int', nullable: true })
  ubicacion_fisica_id: number | null;

  @ManyToOne(() => UbicacionFisica, (ubicacion: UbicacionFisica) => ubicacion.tramites, { nullable: true })
  @JoinColumn({ name: 'ubicacion_fisica_id' })
  ubicacion_fisica: UbicacionFisica | null;

  @Column({ type: 'int' })
  estado_actual_id: number;

  @ManyToOne(() => EstadoTramite, (estado: EstadoTramite) => estado.tramites_actuales, { nullable: false })
  @JoinColumn({ name: 'estado_actual_id' })
  estado_actual: EstadoTramite;

  @OneToMany(() => Archivo, (archivo: Archivo) => archivo.tramite)
  archivos: Archivo[];

  @OneToMany(() => ComprobantePago, (comprobante: ComprobantePago) => comprobante.tramite)
  comprobantes_pago: ComprobantePago[];

  @OneToMany(() => HistorialEstadoTramite, (historial: HistorialEstadoTramite) => historial.tramite)
  historial_estados: HistorialEstadoTramite[];

  @OneToMany(() => MovimientoFisico, (movimiento: MovimientoFisico) => movimiento.tramite)
  movimientos_fisicos: MovimientoFisico[];

  @CreateDateColumn()
  fecha_registro: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;
}
