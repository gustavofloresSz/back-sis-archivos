import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Permiso } from '../permiso/entities/permiso.entity';
import { Rol } from './entities/rol.entity';
import { RolController } from './rol.controller';
import { RolService } from './rol.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, Usuario, Permiso])],
  controllers: [RolController],
  providers: [RolService],
  exports: [TypeOrmModule, RolService],
})
export class RolModule {}
