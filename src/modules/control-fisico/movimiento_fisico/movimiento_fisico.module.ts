import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoFisico } from './entities/movimiento_fisico.entity';
import { MovimientoFisicoController } from './movimiento_fisico.controller';
import { MovimientoFisicoService } from './movimiento_fisico.service';
import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { Tramite } from '../../gestion-tramites/tramite/entities/tramite.entity';
import { UbicacionFisica } from '../ubicacion-fisica/entities/ubicacion-fisica.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        MovimientoFisico,
        Tramite,
        UbicacionFisica,
        Usuario,
    ])],
    controllers: [MovimientoFisicoController],
    providers: [MovimientoFisicoService],
    exports: [
        TypeOrmModule,
        MovimientoFisicoService
    ]
})

export class MovimientoFisicoModule { }
