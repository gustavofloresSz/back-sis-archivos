import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { PermisoRequerido, PermissionsAny } from './permissions.decorator';

export function PermissionProtectedAny(...permisos: PermisoRequerido[]) {
  return applyDecorators(
    PermissionsAny(...permisos),
    UseGuards(JwtAuthGuard, PermissionGuard),
  );
}
