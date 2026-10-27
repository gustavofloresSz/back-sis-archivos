import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from '../rol/entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { PermisoController } from './permiso.controller';
import { PermisoService } from './permiso.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso, Rol])],
  controllers: [PermisoController],
  providers: [PermisoService],
  exports: [TypeOrmModule, PermisoService],
})
export class PermisoModule {}
