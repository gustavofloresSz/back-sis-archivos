import { Module } from '@nestjs/common';
import { TipoTramiteService } from './tipo_tramite.service';
import { TipoTramiteController } from './tipo_tramite.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoTramite } from './entities/tipo_tramite.entity';

@Module({
  imports: [
        TypeOrmModule.forFeature([TipoTramite])
    ],
  controllers: [TipoTramiteController],
  providers: [TipoTramiteService],
})
export class TipoTramiteModule {}
