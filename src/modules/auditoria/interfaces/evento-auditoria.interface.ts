export interface EventoAuditoria {
  fecha?: Date;
  usuarioId?: number;
  usuario?: string;
  institucion?: string;
  accion: string;
  metodo: string;
  ruta: string;
  registroId?: string | number;
  datos?: unknown;
  cambios?: Array<{
    campo: string;
    antes: unknown;
    despues: unknown;
  }>;
  archivos?: Array<{
    nombre: string;
    tipo?: string;
    tamano?: number;
  }>;
  resultado: 'EXITOSO' | 'RECHAZADO';
  detalleError?: string;
}
