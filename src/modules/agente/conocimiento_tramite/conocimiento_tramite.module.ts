import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConocimientoTramiteService } from './conocimiento_tramite.service';
import { ConocimientoTramiteController } from './conocimiento_tramite.controller';
import { ConocimientoTramite } from './entities/conocimiento_tramite.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([ConocimientoTramite])
  ],
  controllers: [ConocimientoTramiteController],
  providers: [ConocimientoTramiteService],
})
export class ConocimientoTramiteModule {}
