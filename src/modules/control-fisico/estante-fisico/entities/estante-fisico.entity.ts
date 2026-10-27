import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AmbienteFisico } from '../../ambiente-fisico/entities/ambiente-fisico.entity';
import { UbicacionFisica } from '../../ubicacion-fisica/entities/ubicacion-fisica.entity';

@Entity('estante_fisico')
@Unique(['ambiente_fisico_id', 'codigo'])
export class EstanteFisico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  ambiente_fisico_id: number;

  @Column({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @ManyToOne(() => AmbienteFisico, (ambiente: AmbienteFisico) => ambiente.estantes_fisicos)
  @JoinColumn({ name: 'ambiente_fisico_id' })
  ambiente_fisico: AmbienteFisico;

  @OneToMany(() => UbicacionFisica, (ubicacion: UbicacionFisica) => ubicacion.estante_fisico)
  ubicaciones_fisicas: UbicacionFisica[];
}