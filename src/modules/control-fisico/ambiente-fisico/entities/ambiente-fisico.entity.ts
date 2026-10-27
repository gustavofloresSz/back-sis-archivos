import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EstanteFisico } from '../../estante-fisico/entities/estante-fisico.entity';
import { Institucion } from 'src/modules/organizacion/institucion/entities/institucion.entity';

@Entity('ambiente_fisico')
@Unique(['institucion_id', 'nombre'])
export class AmbienteFisico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  institucion_id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @ManyToOne(() => Institucion, (institucion: Institucion) => institucion.ambientes_fisicos)
  @JoinColumn({ name: 'institucion_id' })
  institucion: Institucion;

  @OneToMany(() => EstanteFisico, (estante: EstanteFisico) => estante.ambiente_fisico)
  estantes_fisicos: EstanteFisico[];
}
