import { Module } from '@nestjs/common';
import { AgenteController } from './agente.controller';
import { AgenteService } from './agente.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tramite } from '../gestion-tramites/tramite/entities/tramite.entity';
import { ConocimientoTramiteModule } from './conocimiento_tramite/conocimiento_tramite.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tramite]),
    ConocimientoTramiteModule,
  ],
  controllers: [AgenteController],
  providers: [AgenteService]
})
export class AgenteModule {}
