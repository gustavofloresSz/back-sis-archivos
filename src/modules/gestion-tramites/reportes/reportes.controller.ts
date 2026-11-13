import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PermissionProtected } from '../../auth/decorators';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import { ReportesService } from './reportes.service';
import { BuscarReportesDto } from './dto/buscar-reportes.dto';
import { enviarArchivo } from '../documentos/archivo/archivo-respuesta';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
  ) {}

  @Get('instituciones')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  obtenerInstituciones() {
    return this.reportesService.obtenerInstituciones();
  }

  @Get('tramites')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  buscarTramites(@Query() filtros: BuscarReportesDto) {
    return this.reportesService.buscarTramites(filtros);
  }

  @Get('tramites/:id')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  obtenerTramite(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.obtenerTramite(id);
  }

  @Get('tramites/:id/archivos/:archivoId')
  @PermissionProtected(
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.ARCHIVO, accion: 'ver' },
  )
  async verArchivo(
    @Param('id', ParseIntPipe) id: number,
    @Param('archivoId', ParseIntPipe) archivoId: number,
    @Res() response: Response,
  ) {
    const archivo = await this.reportesService.obtenerArchivo(id, archivoId);
    return enviarArchivo(response, archivo);
  }

  @Get('tramites/:id/archivos/:archivoId/descargar')
  @PermissionProtected(
    { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
    { recurso: RecursoPermiso.ARCHIVO, accion: 'ver' },
    { recurso: RecursoPermiso.ARCHIVO, accion: 'descargar' },
  )
  async descargarArchivo(
    @Param('id', ParseIntPipe) id: number,
    @Param('archivoId', ParseIntPipe) archivoId: number,
    @Res() response: Response,
  ) {
    const archivo = await this.reportesService.obtenerArchivo(id, archivoId);
    return enviarArchivo(response, archivo, true);
  }

}
