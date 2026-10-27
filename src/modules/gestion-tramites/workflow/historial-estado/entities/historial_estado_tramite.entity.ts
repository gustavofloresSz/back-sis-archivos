import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { Tramite } from '../../../tramite/entities/tramite.entity';
import { EstadoTramite } from '../../../catalogos/estado-tramite/entities/estado_tramite.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export interface DocumentosVerificados {
  PLANO: boolean;
  RTA: boolean;
}

@Entity('historial_estado_tramite')
export class HistorialEstadoTramite {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ name: 'tramite_id', type: 'int' })
  tramite_id: number;
  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id: number;
  @Column({ name: 'estado_anterior_id', type: 'int', nullable: true })
  estado_anterior_id: number | null;
  @Column({ name: 'estado_nuevo_id', type: 'int' })
  estado_nuevo_id: number;
  @Column({ type: 'text', nullable: true })
  motivo: string | null;
  @Column({ name: 'documentos_verificados', type: 'jsonb', nullable: true })
  documentos_verificados: DocumentosVerificados | null;
  @ManyToOne(() => Tramite, (tramite: Tramite) => tramite.historial_estados, { nullable: false })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;
  @ManyToOne(() => Usuario, (usuario: Usuario) => usuario.historial_estados, { nullable: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
  @ManyToOne(() => EstadoTramite, (estado: EstadoTramite) => estado.historiales_como_anterior, { nullable: true })
  @JoinColumn({ name: 'estado_anterior_id' })
  estado_anterior: EstadoTramite | null;
  @ManyToOne(() => EstadoTramite, (estado: EstadoTramite) => estado.historiales_como_nuevo, { nullable: false })
  @JoinColumn({ name: 'estado_nuevo_id' })
  estado_nuevo: EstadoTramite;
  @CreateDateColumn({ name: 'fecha_cambio' })
  fecha_cambio: Date;
}
