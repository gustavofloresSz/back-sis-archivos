import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  PERMISSIONS_ANY_KEY,
  PERMISSIONS_KEY,
  PermisoRequerido,
} from '../decorators/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<PermisoRequerido[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requeridosAlternativos =
      this.reflector.getAllAndOverride<PermisoRequerido[]>(
        PERMISSIONS_ANY_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requeridos?.length && !requeridosAlternativos?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: Usuario }>();
    const usuario = request.user;

    if (!usuario) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const permisos = usuario.rol?.permisos ?? [];
    const tienePermiso = (requerido: PermisoRequerido) =>
      permisos.some(
        (permiso) =>
          permiso.recurso === requerido.recurso &&
          (permiso.accion === requerido.accion ||
            permiso.accion === 'gestionar'),
      );
    const faltantes = (requeridos ?? []).filter(
      (requerido) => !tienePermiso(requerido),
    );

    if (faltantes.length) {
      throw new ForbiddenException(
        `No tienes los permisos requeridos: ${faltantes
          .map((permiso) => `${permiso.recurso}:${permiso.accion}`)
          .join(', ')}`,
      );
    }

    if (
      requeridosAlternativos?.length &&
      !requeridosAlternativos.some(tienePermiso)
    ) {
      throw new ForbiddenException(
        `Necesitas al menos uno de estos permisos: ${requeridosAlternativos
          .map((permiso) => `${permiso.recurso}:${permiso.accion}`)
          .join(', ')}`,
      );
    }

    return true;
  }
}
