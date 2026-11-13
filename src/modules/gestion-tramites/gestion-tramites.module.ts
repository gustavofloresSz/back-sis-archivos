import { Module } from '@nestjs/common';
import { CatalogosTramiteModule } from './catalogos/catalogos-tramite.module';
import { DocumentosModule } from './documentos/documentos.module';
import { ReportesModule } from './reportes/reportes.module';
import { TramitesModule } from './tramite/tramites.module';
import { HistorialEstadoTramiteModule } from './workflow/historial-estado/historial_estado_tramite.module';

@Module({
  imports: [
    CatalogosTramiteModule,
    TramitesModule,
    DocumentosModule,
    HistorialEstadoTramiteModule,
    ReportesModule,
  ],
  exports: [
    CatalogosTramiteModule,
    TramitesModule,
    DocumentosModule,
    HistorialEstadoTramiteModule,
    ReportesModule,
  ],
})
export class GestionTramitesModule {}
