import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { UbicacionFisicaService } from './ubicacion-fisica.service';
import { CreateUbicacionFisicaDto } from './dto/create-ubicacion-fisica.dto';
import { UpdateUbicacionFisicaDto } from './dto/update-ubicacion-fisica.dto';
import { PermissionProtected, PermissionProtectedAny, UserRequest } from '../../auth/decorators';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';

@Controller('ubicacion-fisica')
export class UbicacionFisicaController {
  constructor(
    private readonly service: UbicacionFisicaService,
  ) {}

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.UBICACION_FISICA, accion: 'asignar' })
  create(
    @Body()
    dto: CreateUbicacionFisicaDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.create(dto, currentUser);
  }

  @Get()
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  )
  findAll(@UserRequest() currentUser: Usuario) {
    return this.service.findAll(currentUser);
  }

  @Get(':id')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  )
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.findOne(id, currentUser);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.UBICACION_FISICA, accion: 'reubicar' })
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: UpdateUbicacionFisicaDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.UBICACION_FISICA, accion: 'liberar' })
  remove(
    @Param('id', ParseIntPipe)
    id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.remove(id, currentUser);
  }
}
