import {BadRequestException,ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import {
  esAdministradorGeneral,
  obtenerInstitucionParaOperacion,
  obtenerInstitucionRestringida,
  tienePermiso,
  validarOperacionPermitida,
} from '../../usuarios/policies/acceso-institucional.policy';
import { EstadoTramite } from '../catalogos/estado-tramite/entities/estado_tramite.entity';
import {
  HistorialEstadoTramite,
} from './historial-estado/entities/historial_estado_tramite.entity';
import { CambiarEstadoTramiteDto } from '../tramite/dto/cambiar-estado-tramite.dto';
import { Tramite } from '../tramite/entities/tramite.entity';
import {
  EstadoTramiteWorkflow,
  ESTADOS_INICIALES_PERMITIDOS,
  ESTADOS_POSTERIORES_AL_REGISTRO,
  TRANSICIONES_CORRECCION_ADMINISTRATIVA,
  TRANSICIONES_TRAMITE,
} from './tramite-workflow.config';

interface EstadosParaRegistro {
  estadoArchivado: EstadoTramite;
  estadoInicial: EstadoTramite;
  nombreEstadoInicial: EstadoTramiteWorkflow;
}

interface RegistrarHistorialParams {
  tramiteId: number;
  usuarioId: number;
  estadoAnteriorId: number | null;
  estadoNuevoId: number;
  motivo: string;
}

@Injectable()
export class TramiteWorkflowService {
  constructor(
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
    @InjectRepository(EstadoTramite)
    private readonly estadoRepository: Repository<EstadoTramite>,
    @InjectRepository(HistorialEstadoTramite)
    private readonly historialRepository: Repository<HistorialEstadoTramite>,
  ) {}

  async obtenerEstadosParaRegistro(
    estadoInicialId?: number | null,
  ): Promise<EstadosParaRegistro> {
    const estadoArchivado = await this.estadoRepository.findOne({
      where: {
        nombre: EstadoTramiteWorkflow.ARCHIVADO,
        activo: true,
      },
    });

    if (!estadoArchivado) {
      throw new BadRequestException('No existe el estado Archivado');
    }

    const estadoInicial =
      estadoInicialId !== undefined && estadoInicialId !== null
        ? await this.estadoRepository.findOne({
            where: { id: estadoInicialId, activo: true },
          })
        : estadoArchivado;

    if (!estadoInicial) {
      throw new BadRequestException(
        'El estado inicial no existe o no está activo',
      );
    }

    const nombreEstadoInicial = this.obtenerEstadoConfigurado(
      estadoInicial.nombre,
      'inicial',
    );

    const esEstadoBase = ESTADOS_INICIALES_PERMITIDOS.includes(
      nombreEstadoInicial,
    );

    if (
      !esEstadoBase &&
      !ESTADOS_POSTERIORES_AL_REGISTRO.includes(nombreEstadoInicial)
    ) {
      throw new BadRequestException(
        `No se permite registrar un trámite directamente en estado ${estadoInicial.nombre}`,
      );
    }

    return {
      estadoArchivado,
      estadoInicial,
      nombreEstadoInicial,
    };
  }

  registrarEstadoInicial(
    tramiteId: number,
    usuarioId: number,
    estadoInicialId: number,
  ) {
    return this.registrarHistorialEstado({
      tramiteId,
      usuarioId,
      estadoAnteriorId: null,
      estadoNuevoId: estadoInicialId,
      motivo: 'Registro inicial del trámite',
    });
  }

  async cambiarEstado(
    tramiteId: number,
    dto: CambiarEstadoTramiteDto,
    usuario: Usuario,
  ): Promise<void> {
    const tramite = await this.buscarTramiteConEstadoActual(
      tramiteId,
      obtenerInstitucionParaOperacion(usuario),
    );
    const estadoNuevo = await this.buscarEstadoActivo(dto.estado_nuevo_id);
    const estadoActual = tramite.estado_actual;

    if (!estadoActual) {
      throw new BadRequestException(
        'El trámite no tiene estado actual asignado',
      );
    }

    if (estadoActual.id === estadoNuevo.id) {
      throw new BadRequestException('El trámite ya se encuentra en ese estado');
    }

    const nombreEstadoActual = this.obtenerEstadoConfigurado(
      estadoActual.nombre,
      'actual',
    );
    const nombreEstadoNuevo = this.obtenerEstadoConfigurado(
      estadoNuevo.nombre,
      'nuevo',
    );

    if (dto.es_correccion_administrativa === true) {
      this.validarCorreccionAdministrativa(
        nombreEstadoActual,
        nombreEstadoNuevo,
        usuario,
      );
    } else {
      this.validarTransicionNormal(
        nombreEstadoActual,
        nombreEstadoNuevo,
        estadoActual.es_final,
      );
    }

    await this.tramiteRepository.update(
      { id: tramite.id },
      {
        estado_actual_id: estadoNuevo.id,
        observaciones: this.obtenerObservacionVigentePorEstado(
          nombreEstadoNuevo,
          dto.motivo,
          tramite.observaciones,
        ),
      },
    );

    await this.registrarHistorialEstado({
      tramiteId: tramite.id,
      usuarioId: usuario.id,
      estadoAnteriorId: estadoActual.id,
      estadoNuevoId: estadoNuevo.id,
      motivo: dto.motivo,
    });
  }

  async findHistorialEstadosByTramite(
    tramiteId: number,
    usuario: Usuario,
  ) {
    await this.verificarAccesoTramite(
      tramiteId,
      obtenerInstitucionRestringida(usuario),
    );

    return this.historialRepository.find({
      where: { tramite_id: tramiteId },
      relations: {
        usuario: true,
        estado_anterior: true,
        estado_nuevo: true,
      },
      order: {
        fecha_cambio: 'DESC',
        id: 'DESC',
      },
    });
  }

  async findEstadosPermitidos(tramiteId: number, usuario: Usuario) {
    const tramite = await this.buscarTramiteConEstadoActual(
      tramiteId,
      obtenerInstitucionParaOperacion(usuario),
    );
    const estadoActual = tramite.estado_actual;

    if (!estadoActual) {
      throw new BadRequestException(
        'El trámite no tiene estado actual asignado',
      );
    }

    const nombreEstadoActual = this.obtenerEstadoConfigurado(
      estadoActual.nombre,
      'actual',
    );
    const transicionesNormales = estadoActual.es_final
      ? []
      : (TRANSICIONES_TRAMITE[nombreEstadoActual] ?? []);
    const correccionesAdministrativas =
      tienePermiso(
        usuario,
        RecursoPermiso.TRAMITE,
        'corregir_estado',
      )
        ? (TRANSICIONES_CORRECCION_ADMINISTRATIVA[nombreEstadoActual] ?? [])
        : [];
    const nombresEstados = [
      ...new Set([...transicionesNormales, ...correccionesAdministrativas]),
    ];
    const estados = nombresEstados.length
      ? await this.estadoRepository.find({
          where: {
            nombre: In(nombresEstados),
            activo: true,
          },
        })
      : [];
    const estadosPorNombre = new Map(
      estados.map((estado) => [estado.nombre, estado]),
    );

    return {
      estado_actual: estadoActual,
      transiciones: [
        ...this.construirTransiciones(
          transicionesNormales,
          estadosPorNombre,
          false,
        ),
        ...this.construirTransiciones(
          correccionesAdministrativas,
          estadosPorNombre,
          true,
        ),
      ],
    };
  }

  findEstadosInicialesPermitidos() {
    return this.estadoRepository
      .createQueryBuilder('estado')
      .where('estado.activo = :activo', { activo: true })
      .andWhere('estado.nombre IN (:...nombres)', {
        nombres: ESTADOS_POSTERIORES_AL_REGISTRO,
      })
      .orderBy(
        `CASE estado.nombre
          WHEN 'Archivado' THEN 1
          WHEN 'Con observaciones' THEN 2
          WHEN 'Suspendido' THEN 3
          WHEN 'Concluido' THEN 4
          ELSE 5
        END`,
      )
      .getMany();
  }

  private async buscarTramiteConEstadoActual(
    tramiteId: number,
    institucionId: number | null,
  ): Promise<Tramite> {
    const tramite = await this.tramiteRepository.findOne({
      where:
        institucionId === null
          ? { id: tramiteId }
          : {
              id: tramiteId,
              usuario_registro: { institucion_id: institucionId },
            },
      relations: { estado_actual: true },
    });

    if (!tramite) {
      throw new NotFoundException('Trámite no encontrado');
    }

    return tramite;
  }

  private async verificarAccesoTramite(
    tramiteId: number,
    institucionId: number | null,
  ): Promise<void> {
    const existe = await this.tramiteRepository.exists({
      where:
        institucionId === null
          ? { id: tramiteId }
          : {
              id: tramiteId,
              usuario_registro: { institucion_id: institucionId },
            },
    });

    if (!existe) {
      throw new NotFoundException('Trámite no encontrado');
    }
  }

  private async buscarEstadoActivo(estadoId: number): Promise<EstadoTramite> {
    const estado = await this.estadoRepository.findOne({
      where: { id: estadoId, activo: true },
    });

    if (!estado) {
      throw new BadRequestException(
        'El estado nuevo no existe o no está activo',
      );
    }

    return estado;
  }

  private obtenerEstadoConfigurado(
    estado: string,
    tipo: 'actual' | 'nuevo' | 'inicial',
  ): EstadoTramiteWorkflow {
    if (!this.esEstadoWorkflowValido(estado)) {
      throw new BadRequestException(
        `El estado ${tipo} ${estado} no está configurado en el workflow`,
      );
    }

    return estado;
  }

  private validarTransicionNormal(
    estadoActual: EstadoTramiteWorkflow,
    estadoNuevo: EstadoTramiteWorkflow,
    estadoActualEsFinal: boolean,
  ): void {
    if (estadoActualEsFinal) {
      throw new BadRequestException(
        'El trámite se encuentra en un estado final y no puede cambiar por el flujo normal',
      );
    }

    if (!TRANSICIONES_TRAMITE[estadoActual].includes(estadoNuevo)) {
      throw new BadRequestException(
        `No se permite cambiar el trámite de ${estadoActual} a ${estadoNuevo}`,
      );
    }
  }

  private validarCorreccionAdministrativa(
    estadoActual: EstadoTramiteWorkflow,
    estadoNuevo: EstadoTramiteWorkflow,
    usuario: Usuario,
  ): void {
    if (
      !tienePermiso(
        usuario,
        RecursoPermiso.TRAMITE,
        'corregir_estado',
      )
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede realizar correcciones administrativas',
      );
    }

    if (
      !TRANSICIONES_CORRECCION_ADMINISTRATIVA[estadoActual].includes(
        estadoNuevo,
      )
    ) {
      throw new BadRequestException(
        `No se permite realizar corrección administrativa de ${estadoActual} a ${estadoNuevo}`,
      );
    }
  }

  private esEstadoWorkflowValido(
    estado: string,
  ): estado is EstadoTramiteWorkflow {
    return Object.values(EstadoTramiteWorkflow).includes(
      estado as EstadoTramiteWorkflow,
    );
  }

  private construirTransiciones(
    nombres: readonly EstadoTramiteWorkflow[],
    estadosPorNombre: Map<string, EstadoTramite>,
    esCorreccionAdministrativa: boolean,
  ) {
    return nombres.flatMap((nombre) => {
      const estado = estadosPorNombre.get(nombre);

      return estado
        ? [
            {
              estado,
              es_correccion_administrativa: esCorreccionAdministrativa,
            },
          ]
        : [];
    });
  }

  private registrarHistorialEstado(params: RegistrarHistorialParams) {
    const historial = this.historialRepository.create({
      tramite_id: params.tramiteId,
      usuario_id: params.usuarioId,
      estado_anterior_id: params.estadoAnteriorId,
      estado_nuevo_id: params.estadoNuevoId,
      motivo: params.motivo?.trim().toUpperCase(),
      documentos_verificados: null,
    });

    return this.historialRepository.save(historial);
  }

  private obtenerObservacionVigentePorEstado(
    estadoNuevo: EstadoTramiteWorkflow,
    motivo: string,
    observacionActual?: string | null,
  ): string | null {
    if (estadoNuevo === EstadoTramiteWorkflow.CON_OBSERVACIONES) {
      return motivo.trim();
    }

    if (estadoNuevo === EstadoTramiteWorkflow.CONCLUIDO) {
      return 'Sin observaciones pendientes.';
    }

    return observacionActual ?? null;
  }
}
