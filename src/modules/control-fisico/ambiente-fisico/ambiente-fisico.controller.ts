import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  PermissionProtected,
  PermissionProtectedAny,
  UserRequest,
} from '../../auth/decorators';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import { AmbienteFisicoService } from './ambiente-fisico.service';
import { CreateAmbienteFisicoDto } from './dto/create-ambiente-fisico.dto';
import { UpdateAmbienteFisicoDto } from './dto/update-ambiente-fisico.dto';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
const consultarAmbientes = PermissionProtectedAny(
  { recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'ver' },
  { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
  { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
  { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
);

@Controller('ambiente-fisico')
export class AmbienteFisicoController {
  constructor(
    private readonly ambienteFisicoService: AmbienteFisicoService,
  ) {}

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'crear' })
  create(
    @Body() dto: CreateAmbienteFisicoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.ambienteFisicoService.create(dto, currentUser);
  }

  @Get()
  @consultarAmbientes
  findAll(@UserRequest() currentUser: Usuario) {
    return this.ambienteFisicoService.findAll(currentUser);
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'ver' })
  findPaginated(
    @Query() dto: PaginationQueryDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.ambienteFisicoService.findPaginated(dto, currentUser);
  }

  @Get(':id')
  @consultarAmbientes
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.ambienteFisicoService.findOne(id, currentUser);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAmbienteFisicoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.ambienteFisicoService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'desactivar' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.ambienteFisicoService.remove(id, currentUser);
  }
}
