import { Module } from '@nestjs/common';
import { EstanteFisicoService } from './estante-fisico.service';
import { EstanteFisicoController } from './estante-fisico.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmbienteFisico } from '../ambiente-fisico/entities/ambiente-fisico.entity';
import { EstanteFisico } from './entities/estante-fisico.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstanteFisico,
      AmbienteFisico,
    ]),
  ],
  controllers: [EstanteFisicoController],
  providers: [EstanteFisicoService],
  exports: [
    TypeOrmModule,
    EstanteFisicoService,
  ],
})
export class EstanteFisicoModule {}
