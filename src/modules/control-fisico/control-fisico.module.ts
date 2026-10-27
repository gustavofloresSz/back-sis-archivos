import { Module } from '@nestjs/common';
import { AmbienteFisicoModule } from './ambiente-fisico/ambiente-fisico.module';
import { EstanteFisicoModule } from './estante-fisico/estante-fisico.module';
import { MovimientoFisicoModule } from './movimiento_fisico/movimiento_fisico.module';
import { UbicacionFisicaModule } from './ubicacion-fisica/ubicacion-fisica.module';

@Module({
  imports: [
    AmbienteFisicoModule,
    EstanteFisicoModule,
    UbicacionFisicaModule,
    MovimientoFisicoModule,
  ],
  exports: [
    AmbienteFisicoModule,
    EstanteFisicoModule,
    UbicacionFisicaModule,
    MovimientoFisicoModule,
  ],
})
export class ControlFisicoModule {}
