import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { obtenerInstitucionRestringida } from '../../../usuarios/policies/acceso-institucional.policy';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { EstadoTramiteWorkflow } from '../../workflow/tramite-workflow.config';
import { HistorialEstadoTramite } from '../../workflow/historial-estado/entities/historial_estado_tramite.entity';
import {
  ResumenEstadoWorkflow,
  ResumenTransicionWorkflow,
  ResumenWorkflowTramites,
} from '../interfaces/resumen-workflow.interface';
import { FiltrosResumenWorkflowDto } from '../dto/filtros-resumen-workflow.dto';

interface ConteoEstadoRaw {
  estado: string;
  cantidad: string;
}

interface ConteoTransicionRaw {
  origen: string | null;
  destino: string;
  cantidad: string;
}

@Injectable()
export class ResumenWorkflowService {
  constructor(
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
    @InjectRepository(HistorialEstadoTramite)
    private readonly historialRepository: Repository<HistorialEstadoTramite>,
  ) {}

  async obtenerResumen(
    currentUser: Usuario,
    filtros: FiltrosResumenWorkflowDto = {},
  ): Promise<ResumenWorkflowTramites> {
    this.validarRangoFechas(filtros);
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const [conteosEstado, conteosTransicion] = await Promise.all([
      this.contarEstados(institucionId, filtros),
      this.contarTransiciones(institucionId, filtros),
    ]);

    const cantidades = new Map(
      conteosEstado.map((registro) => [
        this.normalizar(registro.estado),
        Number(registro.cantidad),
      ]),
    );
    const total = [...cantidades.values()].reduce(
      (acumulado, cantidad) => acumulado + cantidad,
      0,
    );
    const estados = this.construirEstados(cantidades, total);
    return {
      alcance: {
        tipo: institucionId == null ? 'global' : 'institucion',
        institucion_id: institucionId,
        institucion_nombre:
          institucionId == null
            ? null
            : (currentUser.institucion?.nombre ?? null),
      },
      indicadores: {
        total,
      },
      estados,
      transiciones: conteosTransicion.map(
        (registro): ResumenTransicionWorkflow => ({
          origen: registro.origen ?? 'Inicio',
          destino: registro.destino,
          cantidad: Number(registro.cantidad),
        }),
      ),
    };
  }

  private contarEstados(
    institucionId: number | null,
    filtros: FiltrosResumenWorkflowDto,
  ): Promise<ConteoEstadoRaw[]> {
    const query = this.tramiteRepository
      .createQueryBuilder('tramite')
      .innerJoin('tramite.estado_actual', 'estado')
      .innerJoin('tramite.usuario_registro', 'usuario')
      .select('estado.nombre', 'estado')
      .addSelect('COUNT(tramite.id)', 'cantidad')
      .groupBy('estado.id')
      .addGroupBy('estado.nombre')
      .orderBy('estado.id', 'ASC');

    this.aplicarAlcanceInstitucional(query, institucionId, 'usuario');
    this.aplicarFiltros(query, filtros);
    return query.getRawMany<ConteoEstadoRaw>();
  }

  private contarTransiciones(
    institucionId: number | null,
    filtros: FiltrosResumenWorkflowDto,
  ): Promise<ConteoTransicionRaw[]> {
    const query = this.historialRepository
      .createQueryBuilder('historial')
      .leftJoin('historial.estado_anterior', 'estado_anterior')
      .innerJoin('historial.estado_nuevo', 'estado_nuevo')
      .innerJoin('historial.tramite', 'tramite')
      .innerJoin('tramite.usuario_registro', 'usuario')
      .select('estado_anterior.nombre', 'origen')
      .addSelect('estado_nuevo.nombre', 'destino')
      .addSelect('COUNT(historial.id)', 'cantidad')
      .groupBy('estado_anterior.id')
      .addGroupBy('estado_anterior.nombre')
      .addGroupBy('estado_nuevo.id')
      .addGroupBy('estado_nuevo.nombre');

    this.aplicarAlcanceInstitucional(query, institucionId, 'usuario');
    this.aplicarFiltros(query, filtros);
    return query.getRawMany<ConteoTransicionRaw>();
  }

  private aplicarFiltros<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    filtros: FiltrosResumenWorkflowDto,
  ): void {
    if (filtros.fecha_desde) {
      query.andWhere('tramite.fecha_registro::date >= :fechaDesde', {
        fechaDesde: filtros.fecha_desde,
      });
    }

    if (filtros.fecha_hasta) {
      query.andWhere('tramite.fecha_registro::date <= :fechaHasta', {
        fechaHasta: filtros.fecha_hasta,
      });
    }

    if (filtros.tipo_tramite_id) {
      query.andWhere('tramite.tipo_tramite_id = :tipoTramiteId', {
        tipoTramiteId: filtros.tipo_tramite_id,
      });
    }
  }

  private validarRangoFechas(filtros: FiltrosResumenWorkflowDto): void {
    if (
      filtros.fecha_desde &&
      filtros.fecha_hasta &&
      filtros.fecha_desde > filtros.fecha_hasta
    ) {
      throw new BadRequestException(
        'La fecha desde no puede ser posterior a la fecha hasta',
      );
    }
  }

  private aplicarAlcanceInstitucional<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    institucionId: number | null,
    aliasUsuario: string,
  ): void {
    if (institucionId != null) {
      query.andWhere(`${aliasUsuario}.institucion_id = :institucionId`, {
        institucionId,
      });
    }
  }

  private construirEstados(
    cantidades: Map<string, number>,
    total: number,
  ): ResumenEstadoWorkflow[] {
    return Object.values(EstadoTramiteWorkflow).map((nombre) => {
      const cantidad = cantidades.get(this.normalizar(nombre)) ?? 0;
      return {
        nombre,
        cantidad,
        porcentaje:
          total > 0 ? Number(((cantidad * 100) / total).toFixed(1)) : 0,
        es_final: [
          EstadoTramiteWorkflow.CONCLUIDO,
          EstadoTramiteWorkflow.ANULADO,
          EstadoTramiteWorkflow.ABANDONO,
        ].includes(nombre),
      };
    });
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
