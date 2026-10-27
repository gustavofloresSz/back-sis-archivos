import { Module } from '@nestjs/common';
import { CatalogosTramiteModule } from './catalogos/catalogos-tramite.module';
import { DocumentosModule } from './documentos/documentos.module';
import { ReportesModule } from './reportes/reportes.module';
import { TramitesModule } from './tramite/tramites.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    CatalogosTramiteModule,
    TramitesModule,
    DocumentosModule,
    WorkflowModule,
    ReportesModule,
  ],
  exports: [
    CatalogosTramiteModule,
    TramitesModule,
    DocumentosModule,
    WorkflowModule,
    ReportesModule,
  ],
})
export class GestionTramitesModule {}
