import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateInstitucionDto } from './dto/create-institucion.dto';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';
import { InstitucionService } from './institucion.service';
import { PermissionProtected } from '../../auth/decorators';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Controller('institucion')
export class InstitucionController {
  constructor(
    private readonly service: InstitucionService
  ) { }

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.INSTITUCION, accion: 'crear' })
  create(
    @Body() 
    dto: CreateInstitucionDto
  ) {
    return this.service.create(dto);
  }

  @Get()
  @PermissionProtected({ recurso: RecursoPermiso.INSTITUCION, accion: 'ver' })
  findAll() {
    return this.service.findAll();
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.INSTITUCION, accion: 'ver' })
  findPaginated(@Query() dto: PaginationQueryDto) {
    return this.service.findPaginated(dto);
  }

  @Get(':id')
  @PermissionProtected({ recurso: RecursoPermiso.INSTITUCION, accion: 'ver' })
  findOne(
    @Param('id', ParseIntPipe) 
    id: number
  ) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.INSTITUCION, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    dto: UpdateInstitucionDto
  ) {
    return this.service.update(id, dto);
  }

}
