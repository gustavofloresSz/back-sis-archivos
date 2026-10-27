import { Module } from '@nestjs/common';
import { ArchivoCleanupService } from './archivo-cleaup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archivo } from '../gestion-tramites/documentos/archivo/entities/archivo.entity';
import { ArchivoModule } from '../gestion-tramites/documentos/archivo/archivo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Archivo]),
    ArchivoModule,
  ],
  providers: [ArchivoCleanupService],
  exports: [ArchivoCleanupService],
})
export class TareasModule {}
