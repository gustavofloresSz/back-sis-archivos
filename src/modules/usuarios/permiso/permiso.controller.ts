import { Controller, Get } from '@nestjs/common';
import { PermissionProtected } from '../../auth/decorators/permission-protected.decorator';
import { RecursoPermiso } from './enums/recurso-permiso.enum';
import { PermisoService } from './permiso.service';

@Controller('permisos')
export class PermisoController {
  constructor(private readonly permisoService: PermisoService) {}

  @Get('catalogo')
  @PermissionProtected({ recurso: RecursoPermiso.ROL, accion: 'ver' })
  findCatalogo() {
    return this.permisoService.findCatalogo();
  }

}
