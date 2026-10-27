import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HistorialEstadoTramiteService } from './historial_estado_tramite.service';
import { PermissionProtected, UserRequest } from '../../../auth/decorators';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';

@Controller('historial-estado-tramite')
export class HistorialEstadoTramiteController {
  constructor(
    private readonly service: HistorialEstadoTramiteService
  ) { }

  @Get()
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findAll(@UserRequest() currentUser: Usuario) {
    return this.service.findAll(currentUser);
  }

  @Get(':id')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.findOne(id, currentUser);
  }

}
