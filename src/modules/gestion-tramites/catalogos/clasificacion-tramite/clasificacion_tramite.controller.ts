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
} from '../../../auth/decorators';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';
import { ClasificacionTramiteService } from './clasificacion_tramite.service';
import { CreateClasificacionTramiteDto } from './dto/create-clasificacion_tramite.dto';
import { UpdateClasificacionTramiteDto } from './dto/update-clasificacion_tramite.dto';

import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
@Controller('clasificacion-tramite')
export class ClasificacionTramiteController {
  constructor(private readonly service: ClasificacionTramiteService) {}

  @Post()
  @PermissionProtected({
    recurso: RecursoPermiso.CLASIFICACION_TRAMITE,
    accion: 'crear',
  })
  create(@Body() dto: CreateClasificacionTramiteDto) {
    return this.service.create(dto);
  }

  @Get()
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
  )
  findAll() {
    return this.service.findAll();
  }

  @Get('paginado')
  @PermissionProtected({
    recurso: RecursoPermiso.CLASIFICACION_TRAMITE,
    accion: 'ver',
  })
  findPaginated(@Query() dto: PaginationQueryDto) {
    return this.service.findPaginated(dto);
  }

  @Get(':id')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
    { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @PermissionProtected({
    recurso: RecursoPermiso.CLASIFICACION_TRAMITE,
    accion: 'editar',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClasificacionTramiteDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @PermissionProtected({
    recurso: RecursoPermiso.CLASIFICACION_TRAMITE,
    accion: 'desactivar',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
