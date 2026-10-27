import { Module } from '@nestjs/common';
import { UbicacionFisicaService } from './ubicacion-fisica.service';
import { UbicacionFisicaController } from './ubicacion-fisica.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UbicacionFisica } from './entities/ubicacion-fisica.entity';
import { EstanteFisico } from '../estante-fisico/entities/estante-fisico.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UbicacionFisica,
      EstanteFisico,
    ]),
  ],
  controllers: [UbicacionFisicaController],
  providers: [UbicacionFisicaService],
  exports: [
    TypeOrmModule,
    UbicacionFisicaService,
  ],
})
export class UbicacionFisicaModule {}
