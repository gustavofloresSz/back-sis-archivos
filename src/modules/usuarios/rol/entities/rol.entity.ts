import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import { Permiso } from '../../permiso/entities/permiso.entity';

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion: string | null;

  @OneToMany(() => Usuario, (usuario: Usuario) => usuario.rol)
  usuarios: Usuario[];

  @OneToMany(() => Permiso, (permiso: Permiso) => permiso.rol)
  permisos: Permiso[];
}
