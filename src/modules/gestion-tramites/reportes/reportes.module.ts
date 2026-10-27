import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TramitesModule } from '../tramite/tramites.module';
import { Tramite } from '../tramite/entities/tramite.entity';
import { HistorialEstadoTramite } from '../workflow/historial-estado/entities/historial_estado_tramite.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ResumenWorkflowService } from './services/resumen-workflow.service';

@Module({
  imports: [
    TramitesModule,
    TypeOrmModule.forFeature([Tramite, HistorialEstadoTramite]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService, ResumenWorkflowService],
})
export class ReportesModule {}
