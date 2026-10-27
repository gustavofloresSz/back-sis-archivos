import { RecursoPermiso } from './enums/recurso-permiso.enum';

export interface PermisoCatalogo {
  recurso: RecursoPermiso;
  accion: string;
}

// Decisiones pendientes conservadas fuera del catálogo visible:
// tramite:corregir_estado y tramite:eliminar.
// Los comprobantes heredan los permisos del trámite y el sello pertenece a archivo.
// Los estados del trámite pertenecen a la configuración interna del workflow.
// Los permisos se asignan dentro del rol y no se exponen como recurso funcional.

export const CATALOGO_PERMISOS: readonly PermisoCatalogo[] = [
  { recurso: RecursoPermiso.TRAMITE, accion: 'ver' },
  { recurso: RecursoPermiso.TRAMITE, accion: 'crear' },
  { recurso: RecursoPermiso.TRAMITE, accion: 'editar' },
  { recurso: RecursoPermiso.TRAMITE, accion: 'cambiar_estado' },
  { recurso: RecursoPermiso.ARCHIVO, accion: 'ver' },
  { recurso: RecursoPermiso.ARCHIVO, accion: 'agregar' },
  { recurso: RecursoPermiso.ARCHIVO, accion: 'eliminar' },
  { recurso: RecursoPermiso.ARCHIVO, accion: 'descargar' },
  { recurso: RecursoPermiso.ARCHIVO, accion: 'aplicar_sello' },
  { recurso: RecursoPermiso.USUARIO, accion: 'ver' },
  { recurso: RecursoPermiso.USUARIO, accion: 'crear' },
  { recurso: RecursoPermiso.USUARIO, accion: 'editar' },
  { recurso: RecursoPermiso.ROL, accion: 'ver' },
  { recurso: RecursoPermiso.ROL, accion: 'crear' },
  { recurso: RecursoPermiso.ROL, accion: 'editar' },
  { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'ver' },
  { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'crear' },
  { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'editar' },
  { recurso: RecursoPermiso.TIPO_TRAMITE, accion: 'desactivar' },
  { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'ver' },
  { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'crear' },
  { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'editar' },
  { recurso: RecursoPermiso.CLASIFICACION_TRAMITE, accion: 'desactivar' },
  { recurso: RecursoPermiso.INSTITUCION, accion: 'ver' },
  { recurso: RecursoPermiso.INSTITUCION, accion: 'crear' },
  { recurso: RecursoPermiso.INSTITUCION, accion: 'editar' },
  { recurso: RecursoPermiso.INSTITUCION, accion: 'acceso_global' },
  { recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'ver' },
  { recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'crear' },
  { recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'editar' },
  { recurso: RecursoPermiso.AMBIENTE_FISICO, accion: 'desactivar' },
  { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'ver' },
  { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'crear' },
  { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'editar' },
  { recurso: RecursoPermiso.ESTANTE_FISICO, accion: 'desactivar' },
  { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'ver' },
  { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'asignar' },
  { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'reubicar' },
  { recurso: RecursoPermiso.UBICACION_FISICA, accion: 'liberar' },
  { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'ver' },
  { recurso: RecursoPermiso.MOVIMIENTO_FISICO, accion: 'registrar' },
  { recurso: RecursoPermiso.REPORTE_TRAMITE, accion: 'generar' },
];
