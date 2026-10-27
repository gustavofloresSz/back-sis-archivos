import { Module } from '@nestjs/common';
import { TramitesService } from './tramites.service';
import { TramitesController } from './tramites.controller';
import { Tramite } from './entities/tramite.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoTramite } from '../catalogos/tipo-tramite/entities/tipo_tramite.entity';
import { ArchivoModule } from '../documentos/archivo/archivo.module';
import { ClasificacionTramite } from '../catalogos/clasificacion-tramite/entities/clasificacion_tramite.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { EstadoTramite } from '../catalogos/estado-tramite/entities/estado_tramite.entity';
import { HistorialEstadoTramite } from '../workflow/historial-estado/entities/historial_estado_tramite.entity';
import { ComprobantePagoModule } from '../documentos/comprobante-pago/comprobante_pago.module';
import { UbicacionFisica } from '../../control-fisico/ubicacion-fisica/entities/ubicacion-fisica.entity';
import { TramiteWorkflowService } from '../workflow/tramite-workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tramite,
      TipoTramite,
      ClasificacionTramite,
      Usuario,
      UbicacionFisica,
      EstadoTramite,
      HistorialEstadoTramite,
    ]),
    ArchivoModule,
    ComprobantePagoModule,
  ],
  controllers: [TramitesController],
  providers: [TramitesService, TramiteWorkflowService],
  exports: [TramitesService],
})
export class TramitesModule {}
