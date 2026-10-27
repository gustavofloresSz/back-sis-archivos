import { Tramite } from 'src/modules/gestion-tramites/tramite/entities/tramite.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TipoTramite {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 150, unique: true })
    nombre: string;

    @Column({ type: 'varchar', length: 100 })
    segmento: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    descripcion: string | null;

    @Column({ type: 'boolean', default: true })
    estado: boolean;

    @OneToMany(
        () => Tramite,
        (tramite: Tramite) => tramite.tipo_tramite,
    )
    tramites: Tramite[];
}
