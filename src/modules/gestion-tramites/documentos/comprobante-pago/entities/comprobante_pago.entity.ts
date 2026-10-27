import { Tramite } from '../../../tramite/entities/tramite.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('comprobante_pago')
export class ComprobantePago {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  numero_comprobante: string;

  @Column({ type: 'decimal' })
  monto: number;

  @Column({ type: 'varchar', nullable: true })
  concepto: string | null;

  @Column({ name: 'tramite_id', type: 'int' })
  tramite_id: number;

  @ManyToOne(() => Tramite, (tramite: Tramite) => tramite.comprobantes_pago, { nullable: false })
  @JoinColumn({ name: 'tramite_id' })
  tramite: Tramite;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}
