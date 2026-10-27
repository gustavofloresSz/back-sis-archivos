import { Injectable } from '@nestjs/common';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Tramite } from '../tramite/entities/tramite.entity';
import { TramitesService } from '../tramite/tramites.service';
import { DatosReporteTramite } from './interfaces/datos-reporte-tramite.interface';
import { generarReporteTramitePdf } from './templates/reporte-tramite.template';

@Injectable()
export class ReportesService {
  constructor(private readonly tramitesService: TramitesService) {}

  async generarReporteTramite(id: number, currentUser: Usuario) {
    const tramite = await this.tramitesService.findOne(id, currentUser);
    const datos = this.construirDatosReporte(tramite);
    const pdf = Buffer.from(await generarReporteTramitePdf(datos));

    return {
      pdf,
      nombreArchivo: `reporte-tramite-${this.normalizarNombreArchivo(
        tramite.codigo_tramite,
      )}.pdf`,
    };
  }

  private construirDatosReporte(tramite: Tramite): DatosReporteTramite {
    const ubicacion = tramite.ubicacion_fisica;
    const estante = ubicacion?.estante_fisico;
    const ambiente = estante?.ambiente_fisico;

    return {
      codigo: tramite.codigo_tramite,
      fechaGeneracion: this.formatearFecha(new Date(), true),
      fechaRegistro: this.formatearFecha(tramite.fecha_registro, true),
      gestion: String(tramite.gestion),
      numeroTramite: this.valorOAlternativa(tramite.num_tramite),
      numeroFolder: this.valorOAlternativa(tramite.num_folder),
      solicitante: tramite.nombres_apellidos,
      matricula: this.valorOAlternativa(tramite.matricula),
      segmento: tramite.tipo_tramite.segmento,
      tipoTramite: tramite.tipo_tramite.nombre,
      clasificacion: tramite.clasificacion_tramite.nombre,
      estadoActual: tramite.estado_actual.nombre,
      zona: this.valorOAlternativa(tramite.zona),
      distrito: this.valorOAlternativa(tramite.distrito),
      codigoCatastral: this.valorOAlternativa(tramite.codigo_catastral),
      ubicacionFisica: ubicacion
        ? [
            ambiente?.nombre,
            estante?.codigo ? `Estante ${estante.codigo}` : null,
            `Fila ${ubicacion.fila}`,
            `Columna ${ubicacion.columna}`,
          ]
            .filter(Boolean)
            .join(' - ')
        : 'Sin ubicación física asignada',
      observaciones: this.valorOAlternativa(tramite.observaciones),
      superficies: this.construirSuperficies(tramite),
      historial: (tramite.historial_estados ?? [])
        .slice()
        .sort(
          (primero, segundo) =>
            primero.fecha_cambio.getTime() - segundo.fecha_cambio.getTime(),
        )
        .map((movimiento) => ({
          fecha: this.formatearFecha(movimiento.fecha_cambio, true),
          estado: movimiento.estado_nuevo.nombre,
          motivo: this.valorOAlternativa(movimiento.motivo),
          responsable: movimiento.usuario.nombre_completo,
        })),
    };
  }

  private construirSuperficies(
    tramite: Tramite,
  ): Array<{ nombre: string; valor: string }> {
    return [
      ['Superficie de avance', tramite.sup_avance],
      ['Superficie aprobada', tramite.sup_aprobada],
      ['Superficie construida', tramite.sup_construida],
      ['Superficie afectada', tramite.sup_afectada],
      ['Superficie de área verde', tramite.sup_area_verde],
    ]
      .filter(([, valor]) => valor !== null && valor !== undefined)
      .map(([nombre, valor]) => ({
        nombre: String(nombre),
        valor: `${this.formatearNumero(valor as number)} m²`,
      }));
  }

  private formatearFecha(
    fecha: Date | string | null | undefined,
    incluirHora = false,
  ): string {
    if (!fecha) {
      return 'Sin información';
    }

    const valor = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(valor.getTime())) {
      return 'Sin información';
    }

    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(incluirHora
        ? {
            hour: '2-digit' as const,
            minute: '2-digit' as const,
            hour12: false,
          }
        : {}),
    }).format(valor);
  }

  private formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: 2,
    }).format(Number(valor));
  }

  private valorOAlternativa(valor: unknown): string {
    let texto: string;

    switch (typeof valor) {
      case 'string':
        texto = valor;
        break;
      case 'number':
      case 'boolean':
      case 'bigint':
        texto = String(valor);
        break;
      default:
        return 'Sin información';
    }

    return texto.trim() || 'Sin información';
  }

  private normalizarNombreArchivo(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }
}
