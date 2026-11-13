import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TramitesModule } from '../tramite/tramites.module';
import { Tramite } from '../tramite/entities/tramite.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ArchivoModule } from '../documentos/archivo/archivo.module';

@Module({
  imports: [
    TramitesModule,
    TypeOrmModule.forFeature([Tramite]),
    ArchivoModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
