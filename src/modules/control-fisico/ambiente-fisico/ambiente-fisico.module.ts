import { Module } from '@nestjs/common';
import { AmbienteFisicoService } from './ambiente-fisico.service';
import { AmbienteFisicoController } from './ambiente-fisico.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institucion } from '../../organizacion/institucion/entities/institucion.entity';
import { AmbienteFisico } from './entities/ambiente-fisico.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AmbienteFisico,
      Institucion,
    ]),
  ],
  controllers: [AmbienteFisicoController],
  providers: [AmbienteFisicoService],
  exports: [
    TypeOrmModule,
    AmbienteFisicoService,
  ],
})
export class AmbienteFisicoModule {}
