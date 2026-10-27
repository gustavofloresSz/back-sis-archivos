import { applyDecorators, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Permissions, PermisoRequerido } from './permissions.decorator';

export function PermissionProtected(...permisos: PermisoRequerido[]) {
  return applyDecorators(
    Permissions(...permisos),
    UseGuards(JwtAuthGuard, PermissionGuard),
  );
}
