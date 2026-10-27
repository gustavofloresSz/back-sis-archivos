import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from '../archivo/entities/archivo.entity';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { SelloDocumentoController } from './sello-documento.controller';
import { SelloDocumentoService } from './sello-documento.service';
import { ArchivoModule } from '../archivo/archivo.module';

@Module({
  imports: [TypeOrmModule.forFeature([Archivo, Tramite]), ArchivoModule],
  controllers: [SelloDocumentoController],
  providers: [SelloDocumentoService],
  exports: [SelloDocumentoService],
})
export class SelloDocumentoModule {}
