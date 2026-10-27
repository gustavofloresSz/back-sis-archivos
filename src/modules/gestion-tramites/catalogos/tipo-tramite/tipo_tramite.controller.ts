import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { TipoTramiteService } from './tipo_tramite.service';
import { CreateTipoTramiteDto } from './dto/create-tipo_tramite.dto';
import { UpdateTipoTramiteDto } from './dto/update-tipo_tramite.dto';
import { PermissionProtected, PermissionProtectedAny } from '../../../auth/decorators';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';

import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
@Controller('tipo-tramite')
export class TipoTramiteController {
  constructor(private readonly tipoTramiteService: TipoTramiteService) {}

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'crear' })
  create(@Body() createTipoTramiteDto: CreateTipoTramiteDto) {
    return this.tipoTramiteService.create(createTipoTramiteDto);
  }

  @Get()
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
  )
  findAll() {
    return this.tipoTramiteService.findAll();
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'ver' })
  findPaginated(@Query() dto: PaginationQueryDto) {
    return this.tipoTramiteService.findPaginated(dto);
  }

  @Get(':id')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
  )
  findOne(@Param('id', ParseIntPipe)id: number,) {
    return this.tipoTramiteService.findOne(id);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'editar' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTipoTramiteDto: UpdateTipoTramiteDto,) {
    return this.tipoTramiteService.update(
      id,
      updateTipoTramiteDto,
    );
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'desactivar' })
  remove(@Param('id', ParseIntPipe) id: number,) {
    return this.tipoTramiteService.remove(id);
  }
}
