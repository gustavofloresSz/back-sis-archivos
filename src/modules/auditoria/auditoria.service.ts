import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  access,
  appendFile,
  mkdir,
  open,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { EventoAuditoria } from './interfaces/evento-auditoria.interface';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);
  private readonly zonaHoraria = 'America/La_Paz';
  private readonly directorio: string;
  private colaEscritura: Promise<void> = Promise.resolve();

  constructor(private readonly configService: ConfigService) {
    this.directorio = resolve(
      this.configService.get<string>('AUDIT_DIR') ??
        resolve(process.cwd(), 'audit-logs'),
    );
  }

  registrar(evento: EventoAuditoria): Promise<void> {
    return this.encolar(async () => {
      const fecha = evento.fecha ?? new Date();
      const ruta = this.obtenerRutaArchivo(fecha);

      await this.asegurarArchivo(ruta, fecha);
      await appendFile(ruta, this.formatearEvento({ ...evento, fecha }), 'utf8');
    });
  }

  rotarArchivos(fecha: Date = new Date()): Promise<void> {
    return this.cerrarPeriodoAnterior(fecha).then(() =>
      this.prepararPeriodoActual(fecha),
    );
  }

  cerrarPeriodoAnterior(fecha: Date = new Date()): Promise<void> {
    return this.encolar(async () => {
      await mkdir(this.directorio, { recursive: true });

      const fechaAnterior = new Date(fecha.getTime() - 24 * 60 * 60 * 1000);
      const rutaAnterior = this.obtenerRutaArchivo(fechaAnterior);

      if (
        (await this.existe(rutaAnterior)) &&
        !(await this.tieneMarcaDeCierre(rutaAnterior))
      ) {
        await appendFile(
          rutaAnterior,
          `PERIODO FINALIZADO: ${this.formatearFecha(fecha)}\n${this.separador()}\n`,
          'utf8',
        );
      }
    });
  }

  prepararPeriodoActual(fecha: Date = new Date()): Promise<void> {
    return this.encolar(async () => {
      await this.asegurarArchivo(this.obtenerRutaArchivo(fecha), fecha);
      this.logger.log(`Archivo diario de auditoría preparado en ${this.directorio}`);
    });
  }

  obtenerDirectorio(): string {
    return this.directorio;
  }

  private async asegurarArchivo(ruta: string, fecha: Date): Promise<void> {
    await mkdir(this.directorio, { recursive: true });

    if (await this.existe(ruta)) {
      return;
    }

    const contenido = [
      'AUDITORÍA DEL SISTEMA DE GESTIÓN DE TRÁMITES',
      `PERIODO INICIADO: ${this.formatearFecha(fecha)}`,
      `ZONA HORARIA: ${this.zonaHoraria}`,
      this.separador(),
      '',
    ].join('\n');

    await writeFile(ruta, contenido, { encoding: 'utf8', flag: 'wx' }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      },
    );
  }

  private obtenerRutaArchivo(fecha: Date): string {
    return resolve(
      this.directorio,
      `auditoria-${this.obtenerFechaPeriodo(fecha)}.txt`,
    );
  }

  private obtenerFechaPeriodo(fecha: Date): string {
    const partes = this.obtenerPartesFecha(fecha);

    if (partes.hora < 1) {
      const fechaAnterior = new Date(fecha.getTime() - 24 * 60 * 60 * 1000);
      return this.fechaISO(fechaAnterior);
    }

    return this.fechaISO(fecha);
  }

  private fechaISO(fecha: Date): string {
    const partes = this.obtenerPartesFecha(fecha);
    return `${partes.anio}-${this.dosDigitos(partes.mes)}-${this.dosDigitos(partes.dia)}`;
  }

  private formatearFecha(fecha: Date): string {
    const partes = this.obtenerPartesFecha(fecha);
    return `${this.dosDigitos(partes.dia)}/${this.dosDigitos(partes.mes)}/${partes.anio} ${this.dosDigitos(partes.hora)}:${this.dosDigitos(partes.minuto)}:${this.dosDigitos(partes.segundo)}`;
  }

  private obtenerPartesFecha(fecha: Date) {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(fecha);

    const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
      Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

    return {
      anio: valor('year'),
      mes: valor('month'),
      dia: valor('day'),
      hora: valor('hour'),
      minuto: valor('minute'),
      segundo: valor('second'),
    };
  }

  private formatearEvento(evento: EventoAuditoria & { fecha: Date }): string {
    const lineas = [
      `[${this.formatearFecha(evento.fecha)}]`,
      `Usuario responsable: ${evento.usuario ?? 'No identificado'}`,
      `Usuario ID: ${evento.usuarioId ?? 'No disponible'}`,
      `Institución: ${evento.institucion ?? 'No disponible'}`,
      `Acción: ${evento.accion}`,
      `Operación: ${evento.metodo} ${evento.ruta}`,
    ];

    if (evento.registroId !== undefined) {
      lineas.push(`Registro afectado: ${evento.registroId}`);
    }

    if (evento.cambios !== undefined) {
      if (evento.cambios.length) {
        lineas.push('Campos modificados:');
        for (const cambio of evento.cambios) {
          lineas.push(
            `  Campo: ${cambio.campo}`,
            `    Antes: ${this.serializar(cambio.antes)}`,
            `    Después: ${this.serializar(cambio.despues)}`,
          );
        }
      } else {
        lineas.push('Sin cambios en los campos auditables del registro.');
      }
    } else if (this.tieneDatos(evento.datos)) {
      lineas.push(`Datos de la operación: ${this.serializar(evento.datos)}`);
    }

    if (evento.archivos?.length) {
      lineas.push(`Archivos: ${this.serializar(evento.archivos)}`);
    }

    lineas.push(`Resultado: ${evento.resultado}`);

    if (evento.detalleError) {
      lineas.push(`Detalle: ${evento.detalleError}`);
    }

    lineas.push(this.separador(), '');

    return `${lineas.join('\n')}\n`;
  }

  private serializar(valor: unknown): string {
    try {
      return JSON.stringify(valor);
    } catch {
      return '[DATO NO SERIALIZABLE]';
    }
  }

  private tieneDatos(valor: unknown): boolean {
    if (valor === null || valor === undefined) return false;
    if (Array.isArray(valor)) return valor.length > 0;
    if (typeof valor === 'object') return Object.keys(valor).length > 0;
    return true;
  }

  private async existe(ruta: string): Promise<boolean> {
    try {
      await access(ruta, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async tieneMarcaDeCierre(ruta: string): Promise<boolean> {
    const archivo = await open(ruta, 'r');

    try {
      const informacion = await archivo.stat();
      const longitud = Math.min(informacion.size, 2048);
      const buffer = Buffer.alloc(longitud);
      await archivo.read(buffer, 0, longitud, informacion.size - longitud);
      return buffer.toString('utf8').includes('PERIODO FINALIZADO:');
    } finally {
      await archivo.close();
    }
  }

  private encolar(operacion: () => Promise<void>): Promise<void> {
    const ejecucion = this.colaEscritura.then(operacion, operacion);

    this.colaEscritura = ejecucion.catch((error: unknown) => {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudo escribir la auditoría: ${mensaje}`);
    });

    return this.colaEscritura;
  }

  private dosDigitos(valor: number): string {
    return String(valor).padStart(2, '0');
  }

  private separador(): string {
    return '-'.repeat(80);
  }
}
