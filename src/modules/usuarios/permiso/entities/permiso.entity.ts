import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rol } from '../../rol/entities/rol.entity';
import { RecursoPermiso } from '../enums/recurso-permiso.enum';

@Entity('permiso')
@Unique(['rol_id', 'recurso', 'accion'])
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  rol_id: number;

  @Column({ type: 'enum', enum: RecursoPermiso })
  recurso: RecursoPermiso;

  @Column({ type: 'varchar', length: 100 })
  accion: string;

  @ManyToOne(() => Rol, (rol: Rol) => rol.permisos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;
}
