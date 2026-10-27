import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { EstanteFisicoService } from './estante-fisico.service';
import { CreateEstanteFisicoDto } from './dto/create-estante-fisico.dto';
import { UpdateEstanteFisicoDto } from './dto/update-estante-fisico.dto';
import { PermissionProtected, PermissionProtectedAny, UserRequest } from '../../auth/decorators';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Controller('estante-fisico')
export class EstanteFisicoController {
  constructor(
    private readonly estanteFisicoService: EstanteFisicoService,
  ) {}

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'crear' })
  create(
    @Body()
    createEstanteFisicoDto: CreateEstanteFisicoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.estanteFisicoService.create(
      createEstanteFisicoDto,
      currentUser,
    );
  }

  @Get()
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  )
  findAll(@UserRequest() currentUser: Usuario) {
    return this.estanteFisicoService.findAll(currentUser);
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'ver' })
  findPaginated(
    @Query() dto: PaginationQueryDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.estanteFisicoService.findPaginated(dto, currentUser);
  }

  @Get(':id')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  )
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.estanteFisicoService.findOne(id, currentUser);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    updateEstanteFisicoDto: UpdateEstanteFisicoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.estanteFisicoService.update(
      id,
      updateEstanteFisicoDto,
      currentUser,
    );
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'desactivar' })
  remove(
    @Param('id', ParseIntPipe)
    id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.estanteFisicoService.remove(id, currentUser);
  }
}
