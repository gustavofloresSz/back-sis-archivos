import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AmbienteFisico } from '../../../control-fisico/ambiente-fisico/entities/ambiente-fisico.entity';

@Entity('institucion')
export class Institucion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  sigla: string;

  @OneToMany(() => Usuario, (usuario: Usuario) => usuario.institucion)
  usuarios: Usuario[];

  @OneToMany(() => AmbienteFisico,
    (ambiente: AmbienteFisico) => ambiente.institucion,
  )
  ambientes_fisicos: AmbienteFisico[];
}
