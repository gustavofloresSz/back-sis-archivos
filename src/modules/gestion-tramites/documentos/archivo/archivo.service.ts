import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { dibujarCodigoArchivo } from './pdf/codigo-archivo';

import { Archivo } from './entities/archivo.entity';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { ArchivoEstado } from './enums/archivo-estado.enum';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../../usuarios/policies/acceso-institucional.policy';

export type UploadedFileType = {
  filename: string;
  originalname: string;
  path?: string;
};

@Injectable()
export class ArchivoService {
  private readonly logger = new Logger(ArchivoService.name);

  constructor(
    @InjectRepository(Archivo)
    private readonly archivoRepository: Repository<Archivo>,
  ) {}

  async crearPendiente(file: UploadedFileType) {
    const archivo = this.archivoRepository.create({
      nombre: file.filename,
      codigo: randomUUID(),
      nombre_original: file.originalname,
      ruta: file.path ?? `uploads/${file.filename}`,
      tramite_id: null,
      estado: ArchivoEstado.PENDIENTE,
    });

    return await this.archivoRepository.save(archivo);
  }

  async crearPendientes(files: UploadedFileType[]) {
    if (!files || files.length === 0) {
      return [];
    }

    const archivos = files.map((file) =>
      this.archivoRepository.create({
        nombre: file.filename,
        codigo: randomUUID(),
        nombre_original: file.originalname,
        ruta: file.path ?? `uploads/${file.filename}`,
        tramite_id: null,
        estado: ArchivoEstado.PENDIENTE,
      }),
    );

    return await this.archivoRepository.save(archivos);
  }

  async activarArchivo(archivoId: number, tramite: Tramite) {
    const archivo = await this.archivoRepository.findOneBy({ id: archivoId });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    await this.moverADirectorioTramite(archivo, tramite, 'documentos');

    archivo.tramite_id = tramite.id;
    archivo.estado = ArchivoEstado.ACTIVO;

    return this.archivoRepository.save(archivo);
  }

  async activarArchivos(archivoIds: number[], tramite: Tramite) {
    if (!archivoIds || archivoIds.length === 0) {
      return [];
    }

    const archivos = await this.archivoRepository.find({
      where: {
        id: In(archivoIds),
      },
    });

    const archivosActivados: Archivo[] = [];

    for (const archivo of archivos) {
      await this.moverADirectorioTramite(archivo, tramite, 'documentos');
      archivo.tramite_id = tramite.id;
      archivo.estado = ArchivoEstado.ACTIVO;
      archivosActivados.push(await this.archivoRepository.save(archivo));
    }

    return archivosActivados;
  }

  async prepararDirectoriosTramite(tramite: Tramite) {
    const directorioTramite = this.construirDirectorioTramite(tramite);
    const documentos = resolve(directorioTramite, 'documentos');
    const sellados = resolve(directorioTramite, 'sellados');

    await Promise.all([
      mkdir(documentos, { recursive: true }),
      mkdir(sellados, { recursive: true }),
    ]);

    return { documentos, sellados };
  }

  resolverRutaFisica(archivo: Archivo): string {
    const uploadsDir = this.obtenerDirectorioUploads();
    const ruta = archivo.ruta
      ? isAbsolute(archivo.ruta)
        ? resolve(archivo.ruta)
        : resolve(process.cwd(), archivo.ruta)
      : resolve(uploadsDir, archivo.nombre);
    const rutaRelativa = relative(uploadsDir, ruta);

    if (rutaRelativa.startsWith('..') || isAbsolute(rutaRelativa)) {
      throw new BadRequestException('La ruta del archivo no es válida');
    }

    return ruta;
  }

  rutaParaPersistir(rutaAbsoluta: string): string {
    return relative(process.cwd(), rutaAbsoluta).split(sep).join('/');
  }

  async prepararEntrega(archivo: Archivo) {
    const ruta = this.resolverRutaFisica(archivo);
    const nombre = archivo.nombre_original;
    if (!archivo.codigo || archivo.es_sellado || extname(nombre).toLowerCase() !== '.pdf') {
      return { ruta, nombre };
    }

    // El código se dibuja en una copia de entrega. Los bytes subidos quedan intactos.
    const original = await readFile(ruta).catch((error) => {
      if (error?.code === 'ENOENT') throw new NotFoundException('El archivo no existe en el almacenamiento');
      throw error;
    });
    try {
      const documento = await PDFDocument.load(original);
      await dibujarCodigoArchivo(documento, archivo.codigo);
      return { ruta, nombre, pdf: Buffer.from(await documento.save()) };
    } catch {
      this.logger.warn(`No se pudo imprimir el código en el PDF del archivo ${archivo.id}`);
      return { ruta, nombre };
    }
  }

  async marcarComoHuerfano(archivoId: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const archivo = await this.buscarArchivoInstitucional(
      archivoId,
      obtenerInstitucionRestringida(currentUser),
    );

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    archivo.tramite_id = null;
    // La relación cargada también debe quitarse para que save no restaure el vínculo.
    archivo.tramite = null;
    archivo.estado = ArchivoEstado.HUERFANO;

    return await this.archivoRepository.save(archivo);
  }



  // async update(file: UploadedFileType, tramite: Tramite) {
  //   if (tramite.archivos && tramite.archivos.length > 0) {
  //     const archivoExistente = tramite.archivos[0];
  //     archivoExistente.nombre = file.filename;
  //     archivoExistente.nombre_original = file.originalname;
  //     archivoExistente.ruta = `uploads/${file.filename}`;

  //     return await this.archivoRepository.save(archivoExistente);
  //   }
  //   return await this.create(file, tramite);
  // }

  async findAll(currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    return await this.archivoRepository.find({
      where:
        institucionId === null
          ? { estado: ArchivoEstado.ACTIVO }
          : {
              estado: ArchivoEstado.ACTIVO,
              tramite: {
                usuario_registro: { institucion_id: institucionId },
              },
            },
      relations: {
        tramite: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number, currentUser: Usuario) {
    const archivo = await this.buscarArchivoInstitucional(
      id,
      obtenerInstitucionRestringida(currentUser),
    );
    if (!archivo) {
      throw new BadRequestException('Archivo no encontrado');
    }
    return archivo;
  }

  remove(id: number) {
    return `This action removes a #${id} archivo`;
  }

  private buscarArchivoInstitucional(
    archivoId: number,
    institucionId: number | null,
  ) {
    return this.archivoRepository.findOne({
      where:
        institucionId === null
          ? { id: archivoId, estado: ArchivoEstado.ACTIVO }
          : {
              id: archivoId,
              estado: ArchivoEstado.ACTIVO,
              tramite: {
                usuario_registro: { institucion_id: institucionId },
              },
            },
      relations: {
        tramite: true,
      },
    });
  }

  private async moverADirectorioTramite(
    archivo: Archivo,
    tramite: Tramite,
    tipoDirectorio: 'documentos' | 'sellados',
  ): Promise<void> {
    const directorios = await this.prepararDirectoriosTramite(tramite);
    const rutaOrigen = this.resolverRutaFisica(archivo);
    const rutaDestino = resolve(
      directorios[tipoDirectorio],
      basename(archivo.nombre),
    );

    if (rutaOrigen !== rutaDestino) {
      await rename(rutaOrigen, rutaDestino);
    }

    archivo.nombre = basename(archivo.nombre);
    archivo.ruta = this.rutaParaPersistir(rutaDestino);
  }

  private construirDirectorioTramite(tramite: Tramite): string {
    const identificador = this.sanitizarNombreDirectorio(
      `${tramite.id}-${tramite.codigo_tramite}`,
    );

    return resolve(
      this.obtenerDirectorioUploads(),
      'tramites',
      String(tramite.gestion),
      identificador,
    );
  }

  private obtenerDirectorioUploads(): string {
    return resolve(process.cwd(), 'uploads');
  }

  private sanitizarNombreDirectorio(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}
