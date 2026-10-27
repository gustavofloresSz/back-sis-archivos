import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoTramite } from './entities/estado_tramite.entity';
import { EstadoTramiteController } from './estado_tramite.controller';
import { EstadoTramiteService } from './estado_tramite.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([EstadoTramite])
    ],
    controllers: [EstadoTramiteController],
    providers: [EstadoTramiteService],
    exports: [
        TypeOrmModule,
        EstadoTramiteService
    ]
})

export class EstadoTramiteModule { }
