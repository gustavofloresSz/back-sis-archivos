import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFDocument, StandardFonts } from 'pdf-lib';
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
import { dibujarSelloCopiaLegalizada } from './templates/sello-copia-legalizada.template';
import { ArchivoService } from '../archivo/archivo.service';

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

    const tramite = await this.tramiteRepository.findOne({
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

    const bytesSellados = await this.generarPdfSellado(
      bytesOriginales,
      this.construirDatosSello(tramite),
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
        ),
        ruta: this.archivoService.rutaParaPersistir(rutaDestino),
        tramite_id: tramite.id,
        estado: ArchivoEstado.ACTIVO,
        es_sellado: true,
      });
      const archivoGuardado = await this.archivoRepository.save(archivoSellado);

      return {
        message: 'Sello aplicado correctamente en una nueva hoja final',
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
    datos: DatosSelloDocumento,
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
      const paginaSello = documento.addPage([width, height]);
      paginaSello.setRotation(ultimaPagina.getRotation());
      dibujarSelloCopiaLegalizada(
        paginaSello,
        { regular, negrita },
        datos,
      );
      documento.setModificationDate(new Date());
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

  private construirDatosSello(tramite: Tramite): DatosSelloDocumento {
    return {
      zona: this.normalizar(tramite.zona),
      distrito: this.normalizar(tramite.distrito),
      fechaEmision: this.formatearFechaEmision(new Date()),
    };
  }

  private generarNombreArchivo(nombreOriginalInterno: string): string {
    const nombreBase = basename(
      nombreOriginalInterno,
      extname(nombreOriginalInterno),
    ).replace(/[^a-zA-Z0-9_-]/g, '_');

    return `${Date.now()}-${randomUUID().slice(0, 8)}-${nombreBase}-sellado.pdf`;
  }

  private generarNombreOriginal(nombreOriginal: string): string {
    const nombreBase = basename(nombreOriginal, extname(nombreOriginal));
    return `${nombreBase} - copia legalizada.pdf`;
  }

  private normalizar(valor: string | null | undefined): string {
    return valor?.trim().toUpperCase() || 'SIN REGISTRO';
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
