import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EstadoTramiteService } from './estado_tramite.service';
import { PermissionProtectedAny } from '../../../auth/decorators';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';
@Controller('estado-tramite')
export class EstadoTramiteController {
  constructor(
    private readonly service: EstadoTramiteService
  ) { }

  @Get()
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'cambiar_estado' },
  )
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'cambiar_estado' },
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

}
