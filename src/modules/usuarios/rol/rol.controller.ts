import {Body, Controller,Get,Param,ParseIntPipe,Patch,Post,Query,} from '@nestjs/common';
import { PermissionProtected } from '../../auth/decorators/permission-protected.decorator';
import { RecursoPermiso } from '../permiso/enums/recurso-permiso.enum';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RolService } from './rol.service';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Controller('roles')
export class RolController {
  constructor(private readonly rolService: RolService) { }

  @Post()
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'crear' })
  create(@Body() dto: CreateRolDto) {
    return this.rolService.create(dto);
  }

  @Get()
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'ver' })
  findAll() {
    return this.rolService.findAll();
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'ver' })
  findPaginated(@Query() dto: PaginationQueryDto) {
    return this.rolService.findPaginated(dto);
  }

  @Get(':id')
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'ver' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolService.findOne(id);
  }

  @Patch(':id')
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolDto,
  ) {
    return this.rolService.update(id, dto);
  }

}
