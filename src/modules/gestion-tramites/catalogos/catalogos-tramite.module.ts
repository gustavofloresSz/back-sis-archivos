import { Module } from '@nestjs/common';
import { ClasificacionTramiteModule } from './clasificacion-tramite/clasificacion_tramite.module';
import { EstadoTramiteModule } from './estado-tramite/estado_tramite.module';
import { TipoTramiteModule } from './tipo-tramite/tipo_tramite.module';

@Module({
  imports: [TipoTramiteModule, ClasificacionTramiteModule, EstadoTramiteModule],
  exports: [TipoTramiteModule, ClasificacionTramiteModule, EstadoTramiteModule],
})
export class CatalogosTramiteModule {}
