import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialEstadoTramite } from './entities/historial_estado_tramite.entity';
import { HistorialEstadoTramiteController } from './historial_estado_tramite.controller';
import { HistorialEstadoTramiteService } from './historial_estado_tramite.service';
import { Tramite } from '../../tramite/entities/tramite.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([HistorialEstadoTramite, Tramite])
    ],
    controllers: [HistorialEstadoTramiteController],
    providers: [HistorialEstadoTramiteService],
    exports: [
        TypeOrmModule,
        HistorialEstadoTramiteService
    ]
})

export class HistorialEstadoTramiteModule { }
