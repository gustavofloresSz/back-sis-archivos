import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  concatTransformationMatrix,
  PDFDocument,
  PDFPage,
  popGraphicsState,
  pushGraphicsState,
  StandardFonts,
} from 'pdf-lib';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { Repository } from 'typeorm';
import { ArchivoEstado } from '../archivo/enums/archivo-estado.enum';
import { Archivo } from '../archivo/entities/archivo.entity';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { validarOperacionPermitida } from '../../../usuarios/policies/acceso-institucional.policy';
import { AplicarSelloDocumentoDto } from './dto/aplicar-sello-documento.dto';
import { DatosSelloDocumento } from './interfaces/datos-sello-documento.interface';
import { esUrbanizacion } from '../../catalogos/clasificacion-tramite/es-urbanizacion';
import {
  ALTO_SELLO_PLANO,
  ANCHO_SELLO,
  dibujarSelloCopiaLegalizada,
  GROSOR_BORDE_EXTERIOR,
  PosicionSello,
} from './templates/sello-copia-legalizada.template';
import { ALTO_SELLO_RESOLUCION, dibujarSelloResolucion } from './templates/sello-resolucion.template';
import { ArchivoService } from '../archivo/archivo.service';
import { TipoSello } from '../archivo/enums/tipo-sello.enum';
import { dibujarCodigoArchivo } from '../archivo/pdf/codigo-archivo';

const PUNTOS_POR_CM = 72 / 2.54;
const MEDIDAS_PLANO = { ancho: 10 * PUNTOS_POR_CM, alto: 6.3 * PUNTOS_POR_CM };
const MEDIDAS_RESOLUCION = { ancho: 7.5 * PUNTOS_POR_CM, alto: 3.8 * PUNTOS_POR_CM };
const MARGEN_INICIO_SELLOS = 40;
const MARGEN_FINAL_SELLOS = 18;
const SEPARACION_SELLOS = 16;

@Injectable()
export class SelloDocumentoService {
  constructor(
    @InjectRepository(Archivo)
    private readonly archivoRepository: Repository<Archivo>,
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
    private readonly archivoService: ArchivoService,
  ) {}

  async aplicar(dto: AplicarSelloDocumentoDto, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const archivoOriginal = await this.archivoRepository.findOne({
      where: {
        id: dto.archivo_id,
        tramite: {
          usuario_registro: {
            institucion_id: currentUser.institucion_id,
          },
        },
      },
    });

    if (!archivoOriginal) {
      throw new NotFoundException('Archivo no encontrado');
    }
    if (
      archivoOriginal.estado !== ArchivoEstado.ACTIVO ||
      !archivoOriginal.tramite_id
    ) {
      throw new BadRequestException(
        'El archivo debe estar activo y asociado a un trámite',
      );
    }
    if (archivoOriginal.es_sellado) {
      throw new BadRequestException('El archivo seleccionado ya está sellado');
    }
    if (extname(archivoOriginal.nombre_original).toLowerCase() !== '.pdf') {
      throw new BadRequestException('Solo se pueden sellar archivos PDF');
    }
    if (!archivoOriginal.codigo) {
      throw new BadRequestException('El PDF original no tiene un código de archivo asignado');
    }

    const tramite = await this.tramiteRepository.findOne({
      relations: { tipo_tramite: true, clasificacion_tramite: true },
      where: {
        id: archivoOriginal.tramite_id,
        usuario_registro: {
          institucion_id: currentUser.institucion_id,
        },
      },
    });
    if (!tramite) {
      throw new NotFoundException('Trámite asociado no encontrado');
    }

    const rutaOriginal = this.archivoService.resolverRutaFisica(archivoOriginal);
    if (!existsSync(rutaOriginal)) {
      throw new NotFoundException('El archivo PDF no existe en el almacenamiento');
    }

    const bytesOriginales = await readFile(rutaOriginal);
    if (bytesOriginales.subarray(0, 5).toString() !== '%PDF-') {
      throw new BadRequestException('El archivo seleccionado no es un PDF válido');
    }

    const tiposSello = Object.values(TipoSello).filter(tipo => dto.tipos_sello.includes(tipo));
    const emision = new Date();
    const datosPlano = tiposSello.includes(TipoSello.PLANO)
      ? this.construirDatosSello(tramite, emision)
      : null;
    const bytesSellados = await this.generarPdfSellado(
      bytesOriginales,
      datosPlano,
      archivoOriginal.codigo,
      tiposSello.includes(TipoSello.RESOLUCION),
      emision,
    );
    const nombreArchivo = this.generarNombreArchivo(archivoOriginal.nombre);
    const { sellados } =
      await this.archivoService.prepararDirectoriosTramite(tramite);
    const rutaDestino = resolve(sellados, nombreArchivo);

    await writeFile(rutaDestino, bytesSellados);

    try {
      const archivoSellado = this.archivoRepository.create({
        nombre: nombreArchivo,
        nombre_original: this.generarNombreOriginal(
          archivoOriginal.nombre_original,
          tiposSello,
        ),
        ruta: this.archivoService.rutaParaPersistir(rutaDestino),
        tramite_id: tramite.id,
        estado: ArchivoEstado.ACTIVO,
        es_sellado: true,
        codigo: archivoOriginal.codigo,
        tipos_sello: tiposSello,
      });
      const archivoGuardado = await this.archivoRepository.save(archivoSellado);

      return {
        message: 'Copia legalizada generada correctamente.',
        archivo: archivoGuardado,
      };
    } catch (error) {
      await unlink(rutaDestino).catch(() => undefined);
      throw new InternalServerErrorException(
        'No se pudo registrar el archivo sellado',
        { cause: error },
      );
    }
  }

  private async generarPdfSellado(
    bytesOriginales: Uint8Array,
    datosPlano: DatosSelloDocumento | null,
    codigo: string,
    incluirResolucion: boolean,
    emision: Date,
  ): Promise<Uint8Array> {
    try {
      const documento = await PDFDocument.load(bytesOriginales);
      const paginas = documento.getPages();
      if (!paginas.length) {
        throw new BadRequestException('El PDF no contiene páginas');
      }
      const regular = await documento.embedFont(StandardFonts.Helvetica);
      const negrita = await documento.embedFont(StandardFonts.HelveticaBold);
      const ultimaPagina = paginas[paginas.length - 1];
      const { width, height } = ultimaPagina.getSize();
      // La hoja nueva usa las dimensiones visibles para dibujar ambos elementos
      // en la misma orientación que verá el lector.
      const girada = Math.abs(ultimaPagina.getRotation().angle % 180) === 90;
      const separacion = datosPlano && incluirResolucion ? SEPARACION_SELLOS : 0;
      const altoSellos = (datosPlano ? MEDIDAS_PLANO.alto : 0)
        + (incluirResolucion ? MEDIDAS_RESOLUCION.alto : 0) + separacion;
      const anchoSellos = datosPlano ? MEDIDAS_PLANO.ancho : MEDIDAS_RESOLUCION.ancho;
      // Si la hoja de origen es pequeña, amplía la hoja final para no reducir el sello.
      const ancho = Math.max(
        girada ? height : width,
        MARGEN_INICIO_SELLOS + anchoSellos + MARGEN_FINAL_SELLOS,
      );
      const alto = Math.max(
        girada ? width : height,
        MARGEN_INICIO_SELLOS + altoSellos + MARGEN_FINAL_SELLOS,
      );
      const paginaSello = documento.addPage([ancho, alto]);
      const fuentes = { regular, negrita };
      let y = alto - MARGEN_INICIO_SELLOS;
      if (datosPlano) {
        this.dibujarSelloAMedida(paginaSello, y, ALTO_SELLO_PLANO, MEDIDAS_PLANO, posicion =>
          dibujarSelloCopiaLegalizada(paginaSello, fuentes, datosPlano, posicion),
        );
        y -= MEDIDAS_PLANO.alto + separacion;
      }
      if (incluirResolucion) {
        const datosResolucion = {
          fecha: this.formatearFechaEmision(emision),
          hora: emision.toLocaleTimeString('es-BO', {
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/La_Paz',
          }),
        };
        this.dibujarSelloAMedida(paginaSello, y, ALTO_SELLO_RESOLUCION, MEDIDAS_RESOLUCION, posicion =>
          dibujarSelloResolucion(paginaSello, fuentes, datosResolucion, posicion),
        );
      }
      await dibujarCodigoArchivo(documento, codigo);
      documento.setModificationDate(emision);
      documento.setProducer('Sistema de Gestión de Trámites Urbanos');

      return documento.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        'No se pudo procesar el PDF seleccionado',
        { cause: error },
      );
    }
  }

  private dibujarSelloAMedida(
    pagina: PDFPage,
    y: number,
    altoPlantilla: number,
    medidas: { ancho: number; alto: number },
    dibujar: (posicion: PosicionSello) => void,
  ): void {
    // El trazo se centra en el contorno: el grosor también cuenta para la medida exterior.
    const escalaX = medidas.ancho / (ANCHO_SELLO + GROSOR_BORDE_EXTERIOR);
    const escalaY = medidas.alto / (altoPlantilla + GROSOR_BORDE_EXTERIOR);
    const medioBorde = GROSOR_BORDE_EXTERIOR / 2;
    pagina.pushOperators(
      pushGraphicsState(),
      concatTransformationMatrix(
        escalaX, 0, 0, escalaY,
        MARGEN_INICIO_SELLOS + medioBorde * escalaX,
        y - medioBorde * escalaY,
      ),
    );
    dibujar({ x: 0, y: 0, escala: 1 });
    pagina.pushOperators(popGraphicsState());
  }

  private construirDatosSello(tramite: Tramite, emision: Date): DatosSelloDocumento {
    const datos: DatosSelloDocumento = {
      tipoPlano: this.normalizar(tramite.tipo_tramite?.nombre),
      resolucionMunicipal: this.normalizar(tramite.resolucion_municipal),
      fechaResolucion: this.formatearFechaResolucion(tramite.fecha_resolucion),
      zona: this.normalizar(tramite.zona),
      distrito: this.normalizar(tramite.distrito),
      fechaEmision: this.formatearFechaEmision(emision),
    };
    if (esUrbanizacion(tramite.clasificacion_tramite?.nombre)) {
      const manzano = tramite.manzano?.trim();
      const lote = tramite.lote?.trim();
      const superficie = tramite.superficie;
      if (!manzano || !lote || superficie == null || !Number.isFinite(Number(superficie)) || Number(superficie) < 0) {
        throw new BadRequestException(
          'Completa Manzano, Lote y Superficie en Clasificación antes de aplicar el sello.',
        );
      }
      datos.urbanizacion = { manzano, lote, superficie: String(superficie) };
    }
    return datos;
  }

  private generarNombreArchivo(nombreOriginalInterno: string): string {
    const nombreBase = basename(
      nombreOriginalInterno,
      extname(nombreOriginalInterno),
    ).replace(/[^a-zA-Z0-9_-]/g, '_');

    return `${Date.now()}-${randomUUID().slice(0, 8)}-${nombreBase}-sellado.pdf`;
  }

  private generarNombreOriginal(nombreOriginal: string, tiposSello: TipoSello[]): string {
    const nombreBase = basename(nombreOriginal, extname(nombreOriginal));
    const etiquetas: Record<TipoSello, string> = {
      [TipoSello.PLANO]: 'Plano',
      [TipoSello.RESOLUCION]: 'Resolución',
    };
    const sellos = tiposSello.map(tipo => etiquetas[tipo]).join(' y ');
    const sufijo = ` - copia legalizada (${sellos}).pdf`;
    const limiteNombreBase = 255 - sufijo.length;
    const nombreCorto = Array.from(nombreBase).slice(0, limiteNombreBase).join('').trimEnd();
    return `${nombreCorto}${sufijo}`;
  }

  private normalizar(valor: string | null | undefined): string {
    return valor?.trim().toUpperCase() || '---';
  }

  private formatearFechaResolucion(fecha: string | null): string {
    // Las columnas DATE no tienen zona horaria: evita desplazar la fecha un día.
    const partes = fecha?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '---';
  }

  private formatearFechaEmision(fecha: Date): string {
    return fecha.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/La_Paz',
    });
  }
}
