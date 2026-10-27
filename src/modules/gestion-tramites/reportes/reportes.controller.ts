import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PermissionProtected, UserRequest } from '../../auth/decorators';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import { ReportesService } from './reportes.service';
import { ResumenWorkflowService } from './services/resumen-workflow.service';
import { FiltrosResumenWorkflowDto } from './dto/filtros-resumen-workflow.dto';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly resumenWorkflowService: ResumenWorkflowService,
  ) {}

  @Get('tramites/resumen-workflow')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  obtenerResumenWorkflow(
    @Query() filtros: FiltrosResumenWorkflowDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.resumenWorkflowService.obtenerResumen(currentUser, filtros);
  }

  @Get('tramites/:id/pdf')
  @PermissionProtected({ recurso: RecursoPermiso.REPORTE_TRAMITE, accion: 'generar' })
  async generarReporteTramite(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
    @Res() response: Response,
  ) {
    const reporte = await this.reportesService.generarReporteTramite(
      id,
      currentUser,
    );

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${reporte.nombreArchivo}"`,
      'Content-Length': reporte.pdf.length,
      'Cache-Control': 'private, no-store',
    });

    return response.end(reporte.pdf);
  }
}
