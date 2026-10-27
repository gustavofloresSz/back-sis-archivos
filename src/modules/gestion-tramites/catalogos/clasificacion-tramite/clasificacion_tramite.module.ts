import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasificacionTramite } from './entities/clasificacion_tramite.entity';
import { ClasificacionTramiteController } from './clasificacion_tramite.controller';
import { ClasificacionTramiteService } from './clasificacion_tramite.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ClasificacionTramite])
    ],
    controllers: [ClasificacionTramiteController],
    providers: [ClasificacionTramiteService],
    exports: [TypeOrmModule, ClasificacionTramiteService]
})

export class ClasificacionTramiteModule { }
