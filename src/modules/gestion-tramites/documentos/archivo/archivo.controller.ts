import { Controller, Get, Param, Delete, ParseIntPipe, Res } from '@nestjs/common';
import { ArchivoService } from './archivo.service';
import { enviarArchivo } from './archivo-respuesta';
import { Response } from 'express'; 
import { PermissionProtected, UserRequest } from '../../../auth/decorators';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';

@Controller('archivo')
export class ArchivoController {
  constructor(
    private readonly archivoService: ArchivoService
  ) {}

  @Get()
  @PermissionProtected({ recurso: RecursoPermiso.ARCHIVO, accion: 'ver' })
  findAll(@UserRequest() currentUser: Usuario) {
    return this.archivoService.findAll(currentUser);
  }

  @Get('ver/:id')
  @PermissionProtected({ recurso: RecursoPermiso.ARCHIVO, accion: 'ver' })
  async FindOne(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
    @Res() res: Response,
  ) {
    const archivo = await this.archivoService.findOne(id, currentUser);
    return enviarArchivo(res, await this.archivoService.prepararEntrega(archivo));
  }

  @Get('descargar/:id')
  @PermissionProtected(
    { recurso: RecursoPermiso.ARCHIVO, accion: 'ver' },
    { recurso: RecursoPermiso.ARCHIVO, accion: 'descargar' },
  )
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
    @Res() res: Response,
  ) {
    const archivo = await this.archivoService.findOne(id, currentUser);
    return enviarArchivo(res, await this.archivoService.prepararEntrega(archivo), true);
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.ARCHIVO, accion: 'eliminar' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.archivoService.marcarComoHuerfano(id, currentUser);
  }
}
