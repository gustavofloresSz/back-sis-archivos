import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import { UpdateTramiteDto } from './dto/update-tramite.dto';
import { Tramite } from './entities/tramite.entity';
import { TipoTramite } from '../catalogos/tipo-tramite/entities/tipo_tramite.entity';
import { ClasificacionTramite } from '../catalogos/clasificacion-tramite/entities/clasificacion_tramite.entity';
import { esUrbanizacion } from '../catalogos/clasificacion-tramite/es-urbanizacion';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { ArchivoService, UploadedFileType } from '../documentos/archivo/archivo.service';
import { ArchivoEstado } from '../documentos/archivo/enums/archivo-estado.enum';
import { ComprobantePagoService } from '../documentos/comprobante-pago/comprobante_pago.service';
import { PaginationTramitesDto } from './dto/pagination-tramites.dto';
import { UbicacionFisica } from '../../control-fisico/ubicacion-fisica/entities/ubicacion-fisica.entity';

import {
  EstadoTramiteWorkflow,
} from '../workflow/tramite-workflow.config';
import { CambiarEstadoTramiteDto } from './dto/cambiar-estado-tramite.dto';
import { GestionarTramiteDto } from './dto/gestionar-tramite.dto';
import { TramiteWorkflowService } from '../workflow/tramite-workflow.service';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../usuarios/policies/acceso-institucional.policy';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import { MovimientoFisico, TipoMovimientoFisico } from '../../control-fisico/movimiento_fisico/entities/movimiento_fisico.entity';

@Injectable()
export class TramitesService {
  constructor(
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,

    @InjectRepository(TipoTramite)
    private readonly tipoRepository: Repository<TipoTramite>,

    @InjectRepository(ClasificacionTramite)
    private readonly clasificacionRepository: Repository<ClasificacionTramite>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(UbicacionFisica)
    private readonly ubicacionRepository: Repository<UbicacionFisica>,

    private readonly archivoService: ArchivoService,
    private readonly comprobantePagoService: ComprobantePagoService,
    private readonly tramiteWorkflowService: TramiteWorkflowService,
  ) {}

  async create(
    dto: CreateTramiteDto,
    currentUser: Usuario,
    files: UploadedFileType[] = [],
  ) {
    validarOperacionPermitida(currentUser);

    if (
      files.length > 0 &&
      !this.tienePermisoArchivo(currentUser, 'agregar')
    ) {
      throw new ForbiddenException(
        'No tienes permiso para agregar archivos al trámite',
      );
    }

    const archivosPendientes =
      files.length > 0 ? await this.archivoService.crearPendientes(files) : [];

    const tipoTramite = await this.tipoRepository.findOneBy({
      id: dto.tipo_tramite_id,
    });

    if (!tipoTramite) {
      throw new BadRequestException('Tipo de trámite no encontrado');
    }

    const clasificacion = await this.clasificacionRepository.findOneBy({
      id: dto.clasificacion_tramite_id,
    });

    if (!clasificacion) {
      throw new BadRequestException('Clasificación de trámite no encontrada');
    }

    const { estadoArchivado, estadoInicial, nombreEstadoInicial } =
      await this.tramiteWorkflowService.obtenerEstadosParaRegistro(
        dto.estado_inicial_id,
      );

    const usuario = await this.usuarioRepository.findOne({
      where: { id: currentUser.id },
      relations: {
        institucion: true,
      },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!usuario.institucion) {
      throw new BadRequestException('El usuario no tiene institución asignada');
    }

    if (dto.ubicacion_fisica_id) {
      await this.validarUbicacionFisicaParaUsuario(
        dto.ubicacion_fisica_id,
        usuario,
      );
    }

    const gestion = Number(dto.gestion);
    const numeroTramite = Number(dto.num_tramite);

    if (!gestion || gestion < 2000 || gestion > 2100) {
      throw new BadRequestException('La gestión del trámite no es válida');
    }

    if (!Number.isInteger(numeroTramite) || numeroTramite < 1) {
      throw new BadRequestException(
        'El número de trámite debe ser un entero mayor a cero',
      );
    }

    const segmento = tipoTramite.segmento.trim().toUpperCase();
    const siglaInstitucion = usuario.institucion.sigla.trim().toUpperCase();
    const numeroTramiteFormateado = numeroTramite
      .toString()
      .padStart(6, '0');
    const codigoTramite = `${segmento}-${siglaInstitucion}-${gestion}-${numeroTramiteFormateado}`;

    const tieneNumeroComprobante =
      dto.numero_comprobante !== undefined &&
      dto.numero_comprobante !== null &&
      dto.numero_comprobante.trim() !== '';

    const tieneMontoComprobante =
      dto.monto_comprobante !== undefined && dto.monto_comprobante !== null;

    if (tieneNumeroComprobante && !tieneMontoComprobante) {
      throw new BadRequestException('Debe ingresar el monto del comprobante');
    }

    if (!tieneNumeroComprobante && tieneMontoComprobante) {
      throw new BadRequestException('Debe ingresar el número de comprobante');
    }

    if (tieneMontoComprobante && Number(dto.monto_comprobante) <= 0) {
      throw new BadRequestException(
        'El monto del comprobante debe ser mayor a 0',
      );
    }

    const datosTramite = {
      ...this.construirDatosParaCrearTramite(dto),
      ...this.datosUrbanizacion(dto, clasificacion.nombre),
    };

    const tramiteGuardado = await this.tramiteRepository.manager.transaction(
      async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
          [
            usuario.institucion_id,
            gestion,
          ],
        );

        const tramiteRepository = manager.getRepository(Tramite);
        const existeCodigoTramite = await tramiteRepository.existsBy({
          codigo_tramite: codigoTramite,
        });

        if (existeCodigoTramite) {
          throw new BadRequestException(
            'El número de trámite ya está registrado para ese segmento, institución y gestión',
          );
        }

        const resultado = await tramiteRepository
          .createQueryBuilder('tramite')
          .innerJoin('tramite.usuario_registro', 'usuario_folder')
          .select('COALESCE(MAX(tramite.num_folder), 0)', 'ultimo_folder')
          .where('usuario_folder.institucion_id = :institucionId', {
            institucionId: usuario.institucion_id,
          })
          .andWhere('tramite.gestion = :gestion', { gestion })
          .getRawOne<{ ultimo_folder: string }>();

        const numFolder = Number(resultado?.ultimo_folder ?? 0) + 1;
        const tramite = tramiteRepository.create({
          ...datosTramite,
          num_folder: numFolder,
          num_tramite: numeroTramite,
          gestion,
          codigo_tramite: codigoTramite,
          usuario_registro_id: usuario.id,
          estado_actual_id: estadoArchivado.id,
        });

        return tramiteRepository.save(tramite);
      },
    );

    await this.archivoService.prepararDirectoriosTramite(tramiteGuardado);

    await this.tramiteWorkflowService.registrarEstadoInicial(
      tramiteGuardado.id,
      usuario.id,
      estadoArchivado.id,
    );

    if (estadoInicial.id !== estadoArchivado.id) {
      const motivoInicial =
        nombreEstadoInicial === EstadoTramiteWorkflow.CON_OBSERVACIONES
          ? dto.observaciones?.trim() ||
            'Trámite registrado con observaciones iniciales.'
          : dto.motivo_estado_inicial?.trim() ||
            `Trámite registrado inicialmente en estado ${estadoInicial.nombre}`;

      await this.cambiarEstadoTramite(
        tramiteGuardado.id,
        {
          estado_nuevo_id: estadoInicial.id,
          motivo: motivoInicial,
          es_correccion_administrativa: false,
        },
        usuario,
      );
    }

    if (archivosPendientes.length > 0) {
      await this.archivoService.activarArchivos(
        archivosPendientes.map((archivo) => archivo.id),
        tramiteGuardado,
      );
    }

    if (tieneNumeroComprobante && tieneMontoComprobante) {
      await this.comprobantePagoService.create({
        numero_comprobante: dto.numero_comprobante!.trim(),
        monto: Number(dto.monto_comprobante),
        concepto: dto.concepto_comprobante?.trim() || null,
        tramite_id: tramiteGuardado.id,
      }, currentUser);
    }

    return {
      message: 'Trámite registrado correctamente',
      tramite: await this.findOne(tramiteGuardado.id, currentUser),
    };
  }

  async update(id: number, dto: UpdateTramiteDto, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);

    const tramite = await this.tramiteRepository.findOne({
      where: {
        id,
        usuario_registro: {
          institucion_id: currentUser.institucion_id,
        },
      },
      relations: {
        tipo_tramite: true,
        clasificacion_tramite: true,
        estado_actual: true,
        usuario_registro: {
          institucion: true,
        },
        ubicacion_fisica: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
      },
    });

    if (!tramite) {
      throw new NotFoundException('Trámite no encontrado');
    }

    if (dto.tipo_tramite_id) {
      const tipoTramite = await this.tipoRepository.findOneBy({
        id: dto.tipo_tramite_id,
      });

      if (!tipoTramite) {
        throw new BadRequestException('Tipo de trámite no encontrado');
      }

      const segmentoActual = tramite.tipo_tramite.segmento.trim().toUpperCase();
      const segmentoNuevo = tipoTramite.segmento.trim().toUpperCase();

      if (segmentoNuevo !== segmentoActual) {
        throw new BadRequestException(
          'El tipo de trámite solo puede cambiarse por otro del mismo segmento',
        );
      }
    }

    if (dto.clasificacion_tramite_id) {
      const clasificacion = await this.clasificacionRepository.findOneBy({
        id: dto.clasificacion_tramite_id,
      });

      if (!clasificacion) {
        throw new BadRequestException('Clasificación de trámite no encontrada');
      }
      tramite.clasificacion_tramite = clasificacion;
    }

    if (dto.ubicacion_fisica_id) {
      await this.validarUbicacionFisicaParaUsuario(
        dto.ubicacion_fisica_id,
        currentUser,
        tramite.id,
      );
    }

    const datosActualizacion = this.construirDatosParaActualizarTramite(dto);
    const urbanizacion = this.datosUrbanizacion(dto, tramite.clasificacion_tramite?.nombre);
    this.asignarSiExiste(datosActualizacion, 'manzano', urbanizacion.manzano);
    this.asignarSiExiste(datosActualizacion, 'lote', urbanizacion.lote);
    this.asignarSiExiste(datosActualizacion, 'superficie', urbanizacion.superficie);

    Object.assign(tramite, datosActualizacion);

    const actualizado = await this.tramiteRepository.save(tramite);

    return {
      message: 'Trámite actualizado correctamente',
      tramite: await this.findOne(actualizado.id, currentUser),
    };
  }

  async findAll(
    paginationDto: PaginationTramitesDto,
    currentUser: Usuario,
  ) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const query = this.tramiteRepository
      .createQueryBuilder('tramite')
      .leftJoinAndSelect('tramite.tipo_tramite', 'tipo_tramite')
      .leftJoinAndSelect(
        'tramite.clasificacion_tramite',
        'clasificacion_tramite',
      )
      .leftJoinAndSelect('tramite.estado_actual', 'estado_actual')
      .leftJoinAndSelect('tramite.usuario_registro', 'usuario_registro')
      .leftJoinAndSelect('usuario_registro.institucion', 'institucion')
      .leftJoinAndSelect('tramite.ubicacion_fisica', 'ubicacion_fisica')
      .leftJoinAndSelect('ubicacion_fisica.estante_fisico', 'estante_fisico')
      .leftJoinAndSelect('estante_fisico.ambiente_fisico', 'ambiente_fisico')
      .leftJoinAndSelect('ambiente_fisico.institucion', 'institucion_ubicacion')
      .orderBy('institucion.sigla', 'ASC')
      .addOrderBy('tramite.gestion', 'ASC')
      .addOrderBy('tramite.num_folder', 'ASC')
      .addOrderBy('tramite.id', 'ASC')
      .skip(skip)
      .take(limit);

    const institucionId = obtenerInstitucionRestringida(currentUser);
    if (institucionId !== null) {
      query.where('usuario_registro.institucion_id = :institucionId', {
        institucionId,
      });
    }

    if (paginationDto.search?.trim()) {
      const search = `%${paginationDto.search.trim().toLowerCase()}%`;

      query.andWhere(
        `
        (
          LOWER(tramite.codigo_tramite) LIKE :search OR
          CAST(tramite.num_folder AS TEXT) LIKE :search OR
          CAST(tramite.num_tramite AS TEXT) LIKE :search OR
          LOWER(tramite.nombres_apellidos) LIKE :search OR
          LOWER(tramite.codigo_catastral) LIKE :search OR
          LOWER(tramite.zona) LIKE :search
        )
        `,
        { search },
      );

      query
        .orderBy('tipo_tramite.segmento', 'ASC')
        .addOrderBy('institucion.sigla', 'ASC')
        .addOrderBy('tramite.gestion', 'ASC')
        .addOrderBy('tramite.num_tramite', 'ASC')
        .addOrderBy('tramite.id', 'ASC');
    }

    if (paginationDto.estado_id) {
      query.andWhere('tramite.estado_actual_id = :estadoId', {
        estadoId: paginationDto.estado_id,
      });
    }

    const [tramites, total] = await query.getManyAndCount();
    const tramiteIds = tramites
      .filter((tramite) => tramite.ubicacion_fisica_id !== null)
      .map((tramite) => tramite.id);
    const ultimosMovimientos = tramiteIds.length
      ? await this.tramiteRepository.manager
          .getRepository(MovimientoFisico)
          .createQueryBuilder('movimiento')
          .select('movimiento.tramite_id', 'tramite_id')
          .addSelect('movimiento.tipo_movimiento', 'tipo_movimiento')
          .distinctOn(['movimiento.tramite_id'])
          .where('movimiento.tramite_id IN (:...tramiteIds)', { tramiteIds })
          .orderBy('movimiento.tramite_id', 'ASC')
          .addOrderBy('movimiento.fecha_movimiento', 'DESC')
          .addOrderBy('movimiento.id', 'DESC')
          .getRawMany<{ tramite_id: number; tipo_movimiento: TipoMovimientoFisico }>()
      : [];
    const movimientosPorTramite = new Map(
      ultimosMovimientos.map((movimiento) => [movimiento.tramite_id, movimiento.tipo_movimiento]),
    );
    const data = tramites.map((tramite) => ({
      ...tramite,
      estado_fisico: !tramite.ubicacion_fisica_id
        ? 'SIN_ASIGNAR'
        : movimientosPorTramite.get(tramite.id) === TipoMovimientoFisico.RETIRO
          ? 'RETIRADO'
          : 'EN_ARCHIVO',
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number, currentUser: Usuario) {
    return this.buscarDetalle(id, obtenerInstitucionRestringida(currentUser));
  }

  async findOneParaReporte(id: number) {
    return this.buscarDetalle(id, null);
  }

  private async buscarDetalle(id: number, institucionId: number | null) {
    const tramite = await this.tramiteRepository.findOne({
      where:
        institucionId === null
          ? { id }
          : {
              id,
              usuario_registro: { institucion_id: institucionId },
            },
      relations: {
        tipo_tramite: true,
        clasificacion_tramite: true,
        estado_actual: true,
        usuario_registro: {
          institucion: true,
        },
        ubicacion_fisica: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
        archivos: true,
        comprobantes_pago: true,
        historial_estados: {
          estado_anterior: true,
          estado_nuevo: true,
          usuario: true,
        },
      },
    });

    if (!tramite) {
      throw new NotFoundException('Trámite no encontrado');
    }

    tramite.archivos = (tramite.archivos ?? []).filter(
      (archivo) => archivo.estado === ArchivoEstado.ACTIVO,
    );
    return tramite;
  }
  async remove(id: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const tramite = await this.findOne(id, currentUser);

    await this.tramiteRepository.remove(tramite);

    return {
      message: 'Trámite eliminado correctamente',
    };
  }

  async cambiarEstadoTramite(
    tramiteId: number,
    dto: CambiarEstadoTramiteDto,
    usuario: Usuario,
  ) {
    await this.tramiteWorkflowService.cambiarEstado(
      tramiteId,
      dto,
      usuario,
    );

    return this.findOne(tramiteId, usuario);
  }

  async findHistorialEstadosByTramite(
    tramiteId: number,
    usuario: Usuario,
  ) {
    return this.tramiteWorkflowService.findHistorialEstadosByTramite(
      tramiteId,
      usuario,
    );
  }

  async findEstadosPermitidos(tramiteId: number, usuario: Usuario) {
    return this.tramiteWorkflowService.findEstadosPermitidos(
      tramiteId,
      usuario,
    );
  }

  findEstadosInicialesPermitidos() {
    return this.tramiteWorkflowService.findEstadosInicialesPermitidos();
  }

  private async validarUbicacionFisicaParaUsuario(
    ubicacionFisicaId: number,
    usuario: Usuario,
    tramiteIdActual?: number,
  ) {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: { id: ubicacionFisicaId },
      relations: {
        estante_fisico: {
          ambiente_fisico: {
            institucion: true,
          },
        },
      },
    });

    if (!ubicacion) {
      throw new BadRequestException('Ubicación física no encontrada');
    }

    const institucionUbicacionId =
      ubicacion.estante_fisico?.ambiente_fisico?.institucion_id;

    if (institucionUbicacionId !== usuario.institucion_id) {
      throw new BadRequestException(
        'La ubicación física no pertenece a la institución del usuario',
      );
    }

    const tramiteOcupante = await this.tramiteRepository.findOne({
      where: {
        ubicacion_fisica_id: ubicacionFisicaId,
        ...(tramiteIdActual ? { id: Not(tramiteIdActual) } : {}),
      },
      select: {
        id: true,
      },
    });

    if (tramiteOcupante) {
      throw new BadRequestException(
        'La ubicación física seleccionada ya se encuentra ocupada por otro trámite',
      );
    }

    return ubicacion;
  }

  private tienePermisoArchivo(usuario: Usuario, accion: string): boolean {
    return (usuario.rol?.permisos ?? []).some(
      (permiso) =>
        permiso.recurso === RecursoPermiso.ARCHIVO &&
        (permiso.accion === accion || permiso.accion === 'gestionar'),
    );
  }

  private datosUrbanizacion(
    dto: Pick<CreateTramiteDto, 'manzano' | 'lote' | 'superficie'>,
    clasificacion: string | undefined,
  ): Partial<Tramite> {
    if (!esUrbanizacion(clasificacion)) {
      return { manzano: null, lote: null, superficie: null };
    }
    return {
      manzano: dto.manzano === undefined ? undefined : dto.manzano?.trim() || null,
      lote: dto.lote === undefined ? undefined : dto.lote?.trim() || null,
      superficie: dto.superficie,
    };
  }

  private construirDatosParaCrearTramite(
    dto: CreateTramiteDto,
  ): Partial<Tramite> {
    return {
      nombres_apellidos: dto.nombres_apellidos,
      matricula: dto.matricula,
      descripcion: dto.descripcion,
      zona: dto.zona,
      distrito: dto.distrito,
      sup_avance: dto.sup_avance,
      sup_aprobada: dto.sup_aprobada,
      sup_construida: dto.sup_construida,
      sup_afectada: dto.sup_afectada,
      sup_area_verde: dto.sup_area_verde,
      codigo_catastral: dto.codigo_catastral,
      resolucion_municipal: dto.resolucion_municipal,
      fecha_resolucion: dto.fecha_resolucion,

      resolucion_complementaria_aclaratoria:
        dto.resolucion_complementaria_aclaratoria,
      fecha_resolucion_complementaria_aclaratoria:
        dto.fecha_resolucion_complementaria_aclaratoria,

      observaciones: dto.observaciones,
      tipo_tramite_id: dto.tipo_tramite_id,
      clasificacion_tramite_id: dto.clasificacion_tramite_id,
      ubicacion_fisica_id: dto.ubicacion_fisica_id ?? null,
    };
  }

  private construirDatosParaActualizarTramite(
    dto: UpdateTramiteDto,
  ): Partial<Tramite> {
    const datos: Partial<Tramite> = {};

    this.asignarSiExiste(datos, 'nombres_apellidos', dto.nombres_apellidos);
    this.asignarSiExiste(datos, 'matricula', dto.matricula);
    this.asignarSiExiste(datos, 'descripcion', dto.descripcion);
    this.asignarSiExiste(datos, 'zona', dto.zona);
    this.asignarSiExiste(datos, 'distrito', dto.distrito);
    this.asignarSiExiste(datos, 'sup_avance', dto.sup_avance);
    this.asignarSiExiste(datos, 'sup_aprobada', dto.sup_aprobada);
    this.asignarSiExiste(datos, 'sup_construida', dto.sup_construida);
    this.asignarSiExiste(datos, 'sup_afectada', dto.sup_afectada);
    this.asignarSiExiste(datos, 'sup_area_verde', dto.sup_area_verde);
    this.asignarSiExiste(datos, 'codigo_catastral', dto.codigo_catastral);
    this.asignarSiExiste(
      datos,
      'resolucion_municipal',
      dto.resolucion_municipal,
    );
    this.asignarSiExiste(datos, 'fecha_resolucion', dto.fecha_resolucion);

    this.asignarSiExiste(
      datos,
      'resolucion_complementaria_aclaratoria',
      dto.resolucion_complementaria_aclaratoria,
    );
    this.asignarSiExiste(
      datos,
      'fecha_resolucion_complementaria_aclaratoria',
      dto.fecha_resolucion_complementaria_aclaratoria,
    );

    this.asignarSiExiste(datos, 'observaciones', dto.observaciones);
    this.asignarSiExiste(datos, 'tipo_tramite_id', dto.tipo_tramite_id);
    this.asignarSiExiste(
      datos,
      'clasificacion_tramite_id',
      dto.clasificacion_tramite_id,
    );
    this.asignarSiExiste(datos, 'ubicacion_fisica_id', dto.ubicacion_fisica_id);

    return datos;
  }

  private asignarSiExiste<K extends keyof Tramite>(
    destino: Partial<Tramite>,
    campo: K,
    valor: Partial<Tramite>[K] | undefined,
  ) {
    if (valor !== undefined) {
      destino[campo] = valor;
    }
  }

  async gestionarTramite(
    tramiteId: number,
    dto: GestionarTramiteDto,
    usuario: Usuario,
    files: UploadedFileType[] = [],
  ) {
    const archivosPendientes =
      files.length > 0 ? await this.archivoService.crearPendientes(files) : [];

    const tramiteActualizado = await this.cambiarEstadoTramite(
      tramiteId,
      {
        estado_nuevo_id: dto.estado_nuevo_id,
        motivo: dto.motivo,
        es_correccion_administrativa: dto.es_correccion_administrativa,
      },
      usuario,
    );

    if (archivosPendientes.length > 0) {
      await this.archivoService.activarArchivos(
        archivosPendientes.map((archivo) => archivo.id),
        tramiteActualizado,
      );
    }

    return {
      message: 'Trámite gestionado correctamente',
      tramite: await this.findOne(tramiteId, usuario),
    };
  }

  async agregarArchivos(
    tramiteId: number,
    usuario: Usuario,
    files: UploadedFileType[] = [],
  ) {
    validarOperacionPermitida(usuario);

    if (files.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un archivo');
    }

    const tramite = await this.findOne(tramiteId, usuario);
    const archivosPendientes = await this.archivoService.crearPendientes(files);
    const archivos = await this.archivoService.activarArchivos(
      archivosPendientes.map((archivo) => archivo.id),
      tramite,
    );

    return {
      message: 'Archivos agregados correctamente',
      archivos,
      tramite: await this.findOne(tramiteId, usuario),
    };
  }
}
