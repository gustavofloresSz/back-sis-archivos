import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateMovimientoFisicoDto } from './dto/create-movimiento_fisico.dto';
import { MovimientoFisicoService } from './movimiento_fisico.service';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
const verMovimientos = PermissionProtected({
  recurso: RecursoPermiso.MOVIMIENTO_FISICO,
  accion: 'ver',
});
const registrarMovimientos = PermissionProtected({
  recurso: RecursoPermiso.MOVIMIENTO_FISICO,
  accion: 'registrar',
});

@Controller('movimiento-fisico')
export class MovimientoFisicoController {
  constructor(private readonly service: MovimientoFisicoService) {}

  @Post()
  @registrarMovimientos
  create(
    @Body() dto: CreateMovimientoFisicoDto,
    @UserRequest() usuario: Usuario,
  ) {
    return this.service.create(dto, usuario);
  }

  @Get()
  @verMovimientos
  findAll(@UserRequest() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get('buscar-tramites')
  @verMovimientos
  buscarTramitesControlFisico(
    @Query() dto: PaginationQueryDto,
    @UserRequest() usuario: Usuario,
  ) {
    return this.service.buscarTramitesControlFisico(dto, usuario);
  }

  @Get('tramite/:tramiteId/estado')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'ver' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  )
  obtenerEstadoFisicoTramite(
    @Param('tramiteId', ParseIntPipe) tramiteId: number,
    @UserRequest() usuario: Usuario,
  ) {
    return this.service.obtenerEstadoFisicoTramite(tramiteId, usuario);
  }

  @Get('tramite/:tramiteId')
  @PermissionProtectedAny(
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'ver' },
  )
  findByTramite(
    @Param('tramiteId', ParseIntPipe) tramiteId: number,
    @UserRequest() usuario: Usuario,
  ) {
    return this.service.findByTramite(tramiteId, usuario);
  }

  @Get(':id')
  @verMovimientos
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() usuario: Usuario,
  ) {
    return this.service.findOne(id, usuario);
  }

}
