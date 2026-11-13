import { Tramite } from '../../../tramite/entities/tramite.entity';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ArchivoEstado } from '../enums/archivo-estado.enum';
import { TipoSello } from '../enums/tipo-sello.enum';

@Entity()
@Index('IDX_archivo_codigo', ['codigo'])
@Index('UQ_archivo_codigo_original', ['codigo'], { unique: true, where: 'NOT es_sellado' })
export class Archivo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: true })
  codigo: string | null;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_original: string;

  @Column({ type: 'varchar', length: 500 })
  ruta: string;

  @Column({ type: 'int', nullable: true })
  tramite_id: number | null;

  @ManyToOne(() => Tramite, (tramite: Tramite) => tramite.archivos, { nullable: true })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite | null;

  @Column({
    type: 'enum',
    enum: ArchivoEstado,
    default: ArchivoEstado.PENDIENTE,
  })
  estado: ArchivoEstado;

  @Column({ type: 'boolean', default: false })
  es_sellado: boolean;

  @Column({ type: 'enum', enum: TipoSello, enumName: 'tipo_sello', array: true, nullable: true })
  tipos_sello: TipoSello[] | null;
  
  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}
