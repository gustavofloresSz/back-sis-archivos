import { Body, Controller, Post } from '@nestjs/common';
import { PermissionProtected, UserRequest } from 'src/modules/auth/decorators';
import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import { RecursoPermiso } from 'src/modules/usuarios/permiso/enums/recurso-permiso.enum';
import { AplicarSelloDocumentoDto } from './dto/aplicar-sello-documento.dto';
import { SelloDocumentoService } from './sello-documento.service';

@Controller('sello-documento')
export class SelloDocumentoController {
  constructor(private readonly selloDocumentoService: SelloDocumentoService) {}

  @Post('aplicar')
  @PermissionProtected({
    recurso: RecursoPermiso.ARCHIVO,
    accion: 'aplicar_sello',
  })
  aplicar(
    @Body() dto: AplicarSelloDocumentoDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.selloDocumentoService.aplicar(dto, currentUser);
  }
}
