import { SetMetadata } from '@nestjs/common';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';

export interface PermisoRequerido {
  recurso: RecursoPermiso;
  accion: string;
}

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_ANY_KEY = 'permissions_any';

export const Permissions = (...permisos: PermisoRequerido[]) =>
  SetMetadata(PERMISSIONS_KEY, permisos);

export const PermissionsAny = (...permisos: PermisoRequerido[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permisos);
