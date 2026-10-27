import { Module } from '@nestjs/common';
import { HistorialEstadoTramiteModule } from './historial-estado/historial_estado_tramite.module';

@Module({
  imports: [HistorialEstadoTramiteModule],
  exports: [HistorialEstadoTramiteModule],
})
export class WorkflowModule {}
