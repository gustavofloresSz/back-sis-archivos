import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tramite } from '../tramite/entities/tramite.entity';
import { TramitesService } from '../tramite/tramites.service';
import { BuscarReportesDto } from './dto/buscar-reportes.dto';
import { ArchivoService } from '../documentos/archivo/archivo.service';
import { Archivo } from '../documentos/archivo/entities/archivo.entity';
import { ArchivoEstado } from '../documentos/archivo/enums/archivo-estado.enum';
import { Institucion } from '../../organizacion/institucion/entities/institucion.entity';
import { MovimientoFisico } from '../../control-fisico/movimiento_fisico/entities/movimiento_fisico.entity';

@Injectable()
export class ReportesService {
  constructor(
    private readonly tramitesService: TramitesService,
    @InjectRepository(Tramite) private readonly tramiteRepository: Repository<Tramite>,
    private readonly archivoService: ArchivoService,
  ) {}

  obtenerInstituciones() {
    return this.tramiteRepository.manager.getRepository(Institucion).find({
      select: { id: true, nombre: true, sigla: true },
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }

  async buscarTramites(filtros: BuscarReportesDto) {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 10;
    const texto = filtros.search?.trim().toLowerCase() ?? '';
    if (filtros.fecha_desde && filtros.fecha_hasta && filtros.fecha_desde > filtros.fecha_hasta) {
      throw new BadRequestException('La fecha desde no puede ser posterior a la fecha hasta');
    }
    if (!texto && !filtros.institucion_id && !filtros.fecha_desde && !filtros.fecha_hasta) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const query = this.tramiteRepository.createQueryBuilder('tramite')
      .leftJoinAndSelect('tramite.tipo_tramite', 'tipo_tramite')
      .leftJoinAndSelect('tramite.estado_actual', 'estado_actual')
      .leftJoinAndSelect('tramite.usuario_registro', 'usuario_registro')
      .leftJoinAndSelect('usuario_registro.institucion', 'institucion');
    const search = `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

    if (texto) switch (filtros.criterio) {
      case 'solicitante':
        query.where('LOWER(tramite.nombres_apellidos) LIKE :search', { search });
        break;
      case 'institucion':
        query.where('(LOWER(institucion.nombre) LIKE :search OR LOWER(institucion.sigla) LIKE :search)', { search });
        break;
      default:
        if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(texto)) {
          const archivosConCodigo = query.subQuery()
            .select('1')
            .from(Archivo, 'archivo')
            .where('archivo.tramite_id = tramite.id')
            .andWhere('archivo.estado = :estadoArchivo')
            .andWhere('archivo.codigo = :codigoArchivo');
          query.where(`EXISTS ${archivosConCodigo.getQuery()}`, {
            estadoArchivo: ArchivoEstado.ACTIVO,
            codigoArchivo: texto,
          });
          break;
        }
        query.where(`(
          LOWER(tramite.codigo_tramite) LIKE :search OR
          LOWER(tramite.nombres_apellidos) LIKE :search OR
          LOWER(tramite.codigo_catastral) LIKE :search OR
          LOWER(tramite.zona) LIKE :search OR
          CAST(tramite.gestion AS TEXT) LIKE :search OR
          CAST(tramite.num_folder AS TEXT) LIKE :search OR
          LOWER(institucion.nombre) LIKE :search OR
          LOWER(institucion.sigla) LIKE :search
        )`, { search });
    }
    if (filtros.institucion_id) {
      query.andWhere('institucion.id = :institucionId', { institucionId: filtros.institucion_id });
    }
    if (filtros.fecha_desde) {
      query.andWhere('tramite.fecha_registro >= CAST(:fechaDesde AS date)', { fechaDesde: filtros.fecha_desde });
    }
    if (filtros.fecha_hasta) {
      query.andWhere("tramite.fecha_registro < CAST(:fechaHasta AS date) + INTERVAL '1 day'", { fechaHasta: filtros.fecha_hasta });
    }
    const [data, total] = await query
      .orderBy('tipo_tramite.segmento', 'ASC')
      .addOrderBy('institucion.sigla', 'ASC')
      .addOrderBy('tramite.gestion', 'ASC')
      .addOrderBy('tramite.num_tramite', 'ASC')
      .addOrderBy('tramite.id', 'ASC')
      .skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async obtenerTramite(id: number) {
    const tramite = await this.tramitesService.findOneParaReporte(id);
    const historialFisico = await this.tramiteRepository.manager.getRepository(MovimientoFisico).find({
      where: { tramite_id: id },
      relations: {
        usuario_registro: true,
        ubicacion_origen: { estante_fisico: { ambiente_fisico: { institucion: true } } },
        ubicacion_destino: { estante_fisico: { ambiente_fisico: { institucion: true } } },
      },
      order: { fecha_movimiento: 'DESC', id: 'DESC' },
    });
    return { ...tramite, historial_fisico: historialFisico };
  }

  async obtenerArchivo(tramiteId: number, archivoId: number) {
    const tramite = await this.tramitesService.findOneParaReporte(tramiteId);
    const archivo = tramite.archivos.find((item) => item.id === archivoId);
    if (!archivo) throw new NotFoundException('Archivo no encontrado en este trámite');
    return this.archivoService.prepararEntrega(archivo);
  }

}
