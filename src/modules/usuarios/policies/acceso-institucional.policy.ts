import { ForbiddenException } from '@nestjs/common';
import { Usuario } from '../entities/usuario.entity';
import { RecursoPermiso } from '../permiso/enums/recurso-permiso.enum';

export function tienePermiso(
  usuario: Usuario,
  recurso: RecursoPermiso,
  accion: string,
): boolean {
  return (usuario.rol?.permisos ?? []).some(
    (permiso) =>
      permiso.recurso === recurso && permiso.accion === accion,
  );
}

export function esAdministradorGeneral(usuario: Usuario): boolean {
  return tienePermiso(
    usuario,
    RecursoPermiso.INSTITUCION,
    'acceso_global',
  );
}

export function obtenerInstitucionRestringida(
  usuario: Usuario,
): number | null {
  return esAdministradorGeneral(usuario) ? null : usuario.institucion_id;
}

export function obtenerInstitucionParaOperacion(usuario: Usuario): number {
  return usuario.institucion_id;
}

export function validarOperacionPermitida(usuario: Usuario): void {
  if (esAdministradorGeneral(usuario)) {
    throw new ForbiddenException(
      'El administrador general tiene acceso de consulta y no puede modificar datos operativos',
    );
  }
}
