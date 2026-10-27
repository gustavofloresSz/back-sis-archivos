import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import {
  catchError,
  defer,
  from,
  map,
  mergeMap,
  Observable,
  throwError,
} from 'rxjs';
import { DataSource } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuditoriaService } from './auditoria.service';
import { EventoAuditoria } from './interfaces/evento-auditoria.interface';

type SolicitudAuditada = Request & {
  user?: Usuario;
  files?: Express.Multer.File[];
};

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);
  private readonly metodosAuditables = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  private readonly camposOmitidos =
    /login|password|contrasena|contraseña|token|authorization|secreto|secret|jwt/i;
  private readonly tablasPorRuta: Record<string, string> = {
    usuarios: 'usuario',
    tramites: 'tramite',
    roles: 'rol',
    institucion: 'institucion',
    'tipo-tramite': 'tipo_tramite',
    'clasificacion-tramite': 'clasificacion_tramite',
    'ambiente-fisico': 'ambiente_fisico',
    'estante-fisico': 'estante_fisico',
    'ubicacion-fisica': 'ubicacion_fisica',
    'comprobante-pago': 'comprobante_pago',
    'conocimiento-tramite': 'conocimiento_tramite',
  };

  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  intercept(contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    if (contexto.getType() !== 'http') {
      return siguiente.handle();
    }

    const solicitud = contexto.switchToHttp().getRequest<SolicitudAuditada>();

    if (!this.debeAuditar(solicitud)) {
      return siguiente.handle();
    }

    return defer(() => this.obtenerRegistro(solicitud)).pipe(
      mergeMap((antes) =>
        siguiente.handle().pipe(
          mergeMap((respuesta) =>
            from(this.registrarResultado(solicitud, respuesta, antes)).pipe(
              map(() => respuesta),
            ),
          ),
        ),
      ),
      catchError((error: unknown) =>
        from(
          this.auditoriaService.registrar(
            this.construirEvento(solicitud, 'RECHAZADO', undefined, error),
          ),
        ).pipe(mergeMap(() => throwError(() => error))),
      ),
    );
  }

  private async registrarResultado(
    solicitud: SolicitudAuditada,
    respuesta: unknown,
    antes?: Record<string, unknown>,
  ): Promise<void> {
    const evento = this.construirEvento(solicitud, 'EXITOSO', respuesta);

    if (antes) {
      const despues = await this.obtenerRegistro(solicitud);
      if (despues) {
        evento.cambios = this.compararRegistros(antes, despues);
        evento.datos = undefined;
      }
    }

    await this.auditoriaService.registrar(evento);
  }

  private async obtenerRegistro(
    solicitud: SolicitudAuditada,
  ): Promise<Record<string, unknown> | undefined> {
    if (!['PUT', 'PATCH'].includes(solicitud.method.toUpperCase())) return;

    const id = Number(this.obtenerParametroId(solicitud.params?.id));
    if (!Number.isSafeInteger(id) || id <= 0) return;

    const segmento = solicitud.originalUrl.split('?')[0].split('/').filter(Boolean)[0];
    const tabla = this.tablasPorRuta[segmento];
    if (!tabla) return;

    try {
      const metadata = this.dataSource.entityMetadatas.find(
        (entidad) => entidad.tableName === tabla,
      );
      if (!metadata) return;

      const registro = await this.dataSource.getRepository(metadata.target).findOne({
        where: { id },
        ...(tabla === 'rol' ? { relations: { permisos: true } } : {}),
      });
      if (!registro) return;

      const datos: Record<string, unknown> = {};
      for (const columna of metadata.columns) {
        if (
          this.camposOmitidos.test(columna.propertyName) ||
          columna.isCreateDate ||
          columna.isUpdateDate ||
          columna.isVersion
        ) continue;
        const valor: unknown = columna.getEntityValue(registro);
        datos[columna.propertyName] = this.normalizarValor(valor);
      }

      if (tabla === 'rol' && Array.isArray(registro.permisos)) {
        datos.permisos = registro.permisos
          .map((permiso: { recurso: string; accion: string }) => ({
            recurso: permiso.recurso,
            accion: permiso.accion,
          }))
          .sort((a, b) => `${a.recurso}:${a.accion}`.localeCompare(`${b.recurso}:${b.accion}`));
      }

      return datos;
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo obtener el registro para comparar la auditoría: ${mensaje}`);
      return undefined;
    }
  }

  private compararRegistros(
    antes: Record<string, unknown>,
    despues: Record<string, unknown>,
  ): NonNullable<EventoAuditoria['cambios']> {
    return Object.keys(antes)
      .filter((campo) => JSON.stringify(antes[campo]) !== JSON.stringify(despues[campo]))
      .map((campo) => ({
        campo,
        antes: this.limpiarDato(antes[campo]),
        despues: this.limpiarDato(despues[campo]),
      }));
  }

  private normalizarValor(valor: unknown): unknown {
    if (valor === undefined || valor === null) return null;
    if (valor instanceof Date) return valor.toISOString();
    if (Array.isArray(valor)) return valor.map((item) => this.normalizarValor(item));
    if (this.esObjeto(valor)) {
      return Object.fromEntries(
        Object.entries(valor)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([clave, dato]) => [clave, this.normalizarValor(dato)]),
      );
    }
    return valor;
  }

  private debeAuditar(solicitud: SolicitudAuditada): boolean {
    if (!this.metodosAuditables.has(solicitud.method.toUpperCase())) {
      return false;
    }

    const ruta = solicitud.originalUrl.split('?')[0].toLowerCase();
    return !ruta.startsWith('/agente') && !ruta.startsWith('/auth');
  }

  private construirEvento(
    solicitud: SolicitudAuditada,
    resultado: EventoAuditoria['resultado'],
    respuesta?: unknown,
    error?: unknown,
  ): EventoAuditoria {
    const usuario = solicitud.user;
    const respuestaObjeto = this.esObjeto(respuesta) ? respuesta : undefined;

    return {
      usuarioId: usuario?.id,
      usuario: usuario?.nombre_completo,
      institucion: usuario?.institucion?.nombre,
      accion: this.obtenerAccion(solicitud),
      metodo: solicitud.method.toUpperCase(),
      ruta: solicitud.originalUrl.split('?')[0],
      registroId:
        this.obtenerParametroId(solicitud.params?.id) ??
        this.obtenerIdRespuesta(respuestaObjeto),
      datos: this.limpiarDato(solicitud.body),
      archivos: this.resumirArchivos(solicitud.files),
      resultado,
      detalleError: this.obtenerMensajeError(error),
    };
  }

  private obtenerAccion(solicitud: SolicitudAuditada): string {
    const ruta = `${solicitud.baseUrl}${solicitud.route?.path ?? ''}`.toLowerCase();

    if (ruta.includes('cambiar-password')) return 'CAMBIAR_PASSWORD';
    if (ruta.includes('cambiar-estado')) return 'CAMBIAR_ESTADO';
    if (ruta.includes('gestionar')) return 'GESTIONAR_TRAMITE';
    if (ruta.includes('sello')) return 'APLICAR_SELLO';
    if (ruta.includes('archivos')) return 'AGREGAR_ARCHIVOS';

    const acciones: Record<string, string> = {
      POST: 'CREAR',
      PUT: 'ACTUALIZAR',
      PATCH: 'ACTUALIZAR',
      DELETE: 'ELIMINAR',
    };

    return acciones[solicitud.method.toUpperCase()] ?? solicitud.method.toUpperCase();
  }

  private limpiarDato(valor: unknown, profundidad = 0): unknown {
    if (valor === null || valor === undefined) return valor;
    if (profundidad > 4) return '[NIVEL OMITIDO]';
    if (typeof valor === 'string') return valor.slice(0, 500);
    if (typeof valor !== 'object') return valor;
    if (Buffer.isBuffer(valor)) return '[CONTENIDO BINARIO OMITIDO]';

    if (Array.isArray(valor)) {
      return valor.slice(0, 50).map((item) => this.limpiarDato(item, profundidad + 1));
    }

    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>)
        .filter(([clave]) => !this.camposOmitidos.test(clave))
        .map(([clave, dato]) => [
          clave,
          this.limpiarDato(dato, profundidad + 1),
        ]),
    );
  }

  private resumirArchivos(archivos?: Express.Multer.File[]) {
    return archivos?.map((archivo) => ({
      nombre: archivo.originalname,
      tipo: archivo.mimetype,
      tamano: archivo.size,
    }));
  }

  private obtenerIdRespuesta(respuesta?: Record<string, unknown>) {
    const id = respuesta?.['id'];
    return typeof id === 'number' || typeof id === 'string' ? id : undefined;
  }

  private obtenerParametroId(valor: unknown): string | undefined {
    if (typeof valor === 'string') return valor;
    if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0];
    return undefined;
  }

  private obtenerMensajeError(error: unknown): string | undefined {
    if (error instanceof Error) return error.message.slice(0, 500);
    return error === undefined ? undefined : String(error).slice(0, 500);
  }

  private esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }

}
