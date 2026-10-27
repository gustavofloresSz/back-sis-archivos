import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Institucion } from '../organizacion/institucion/entities/institucion.entity';
import { Rol } from './rol/entities/rol.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Institucion, Rol])
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports:[
    TypeOrmModule,
    UsuariosService
  ]
})
export class UsuariosModule {}
