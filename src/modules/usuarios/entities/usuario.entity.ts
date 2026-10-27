import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Institucion } from 'src/modules/organizacion/institucion/entities/institucion.entity';
import { Tramite } from 'src/modules/gestion-tramites/tramite/entities/tramite.entity';
import { HistorialEstadoTramite } from 'src/modules/gestion-tramites/workflow/historial-estado/entities/historial_estado_tramite.entity';
import { MovimientoFisico } from 'src/modules/control-fisico/movimiento_fisico/entities/movimiento_fisico.entity';
import { Rol } from '../rol/entities/rol.entity';

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre_completo:string;

    @Column({ type: 'varchar', length: 100, unique: true })
    login:string;

    @Column({ type: 'varchar', length: 255, select: false })
    password:string;

    @Column({ type: 'int' })
    rol_id: number;

    @ManyToOne(() => Rol, (rol: Rol) => rol.usuarios, { nullable: false })
    @JoinColumn({ name: 'rol_id' })
    rol: Rol;

    @Column({type: 'boolean', default: true,})
    estado: boolean;

    @Column({ type: 'int' })
    institucion_id: number;

    @ManyToOne(() => Institucion, (institucion: Institucion) => institucion.usuarios, { nullable: false })
    @JoinColumn({ name: 'institucion_id' })
    institucion: Institucion;

    @OneToMany(() => Tramite, (tramite: Tramite) => tramite.usuario_registro)
    tramites_registrados: Tramite[];

    @OneToMany(() => HistorialEstadoTramite, (historial: HistorialEstadoTramite) => historial.usuario)
    historial_estados: HistorialEstadoTramite[];

    @OneToMany(() => MovimientoFisico, (movimiento: MovimientoFisico) => movimiento.usuario_registro)
    movimientos_fisicos: MovimientoFisico[];

    @CreateDateColumn()
    fecha_creacion: Date;

    @UpdateDateColumn()
    fecha_actualizacion: Date;
}
