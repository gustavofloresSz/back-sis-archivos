import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ComprobantePagoService } from './comprobante_pago.service';
import { CreateComprobantePagoDto } from './dto/create-comprobante_pago.dto';
import { UpdateComprobantePagoDto } from './dto/update-comprobante_pago.dto';
import { PermissionProtected, UserRequest } from '../../../auth/decorators';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../../usuarios/permiso/enums/recurso-permiso.enum';

@Controller('comprobante-pago')
export class ComprobantePagoController {
  constructor(
    private readonly service: ComprobantePagoService
  ) {}

  @Post() 
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'crear' })
  create(
    @Body() dto: CreateComprobantePagoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.create(dto, currentUser);
  }

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

  @Patch(':id') 
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComprobantePagoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id') 
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'editar' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.service.remove(id, currentUser);
  }
}
