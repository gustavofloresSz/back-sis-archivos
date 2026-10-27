import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreateMovimientoFisicoDto } from './dto/create-movimiento_fisico.dto';
import { UpdateMovimientoFisicoDto } from './dto/update-movimiento_fisico.dto';
import { MovimientoFisico, TipoMovimientoFisico } from './entities/movimiento_fisico.entity';
import { Tramite } from '../../gestion-tramites/tramite/entities/tramite.entity';
import { UbicacionFisica } from '../ubicacion-fisica/entities/ubicacion-fisica.entity';
import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from 'src/modules/usuarios/policies/acceso-institucional.policy';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Injectable()
export class MovimientoFisicoService {
  constructor(
    @InjectRepository(MovimientoFisico)
    private readonly repository: Repository<MovimientoFisico>,

    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,

    @InjectRepository(UbicacionFisica)
    private readonly ubicacionRepository: Repository<UbicacionFisica>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(dto: CreateMovimientoFisicoDto, usuarioActual: Usuario) {
    validarOperacionPermitida(usuarioActual);
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioActual.id },
    });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }
    const tramite = await this.tramiteRepository.findOne({
      where: {
        id: dto.tramite_id,
        usuario_registro: {
          institucion_id: usuario.institucion_id,
        },
      },
      relations: {
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
      throw new BadRequestException('Trámite no encontrado');
    }
    if (!tramite.ubicacion_fisica_id) {
      throw new BadRequestException(
        'El trámite no tiene una ubicación física asignada',
      );
    }
    this.validarInstitucionUbicacion(tramite.ubicacion_fisica, usuario);
    const ultimoMovimiento = await this.obtenerUltimoMovimiento(tramite.id);
    if (dto.tipo_movimiento === TipoMovimientoFisico.RETIRO) {
      return this.registrarRetiro(dto, tramite, usuario, ultimoMovimiento);
    }
    if (dto.tipo_movimiento === TipoMovimientoFisico.DEVOLUCION) {
      return this.registrarDevolucion(dto, tramite, usuario, ultimoMovimiento);
    }
    if (dto.tipo_movimiento === TipoMovimientoFisico.TRASLADO) {
      return this.registrarTraslado(dto, tramite, usuario, ultimoMovimiento);
    }
    throw new BadRequestException('Tipo de movimiento físico no válido');
  }

  findAll(usuario: Usuario) {
    const institucionId = obtenerInstitucionRestringida(usuario);
    return this.repository.find({
      where:
        institucionId === null
          ? {}
          : {
              tramite: {
                usuario_registro: { institucion_id: institucionId },
              },
            },
      relations: {
        tramite: true,
        usuario_registro: true,
        ubicacion_origen: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
        ubicacion_destino: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
      },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number, usuario: Usuario) {
    const institucionId = obtenerInstitucionRestringida(usuario);
    const item = await this.repository.findOne({
      where:
        institucionId === null
          ? { id }
          : {
              id,
              tramite: {
                usuario_registro: { institucion_id: institucionId },
              },
            },
      relations: {
        tramite: true,
        usuario_registro: true,
        ubicacion_origen: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
        ubicacion_destino: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Movimiento físico no encontrado');
    }

    return item;
  }

  async findByTramite(tramiteId: number, usuario: Usuario) {
    await this.verificarAccesoTramite(tramiteId, usuario);

    return this.repository.find({
      where: {
        tramite_id: tramiteId,
      },
      relations: {
        usuario_registro: true,
        ubicacion_origen: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
        ubicacion_destino: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
      },
      order: {
        fecha_movimiento: 'DESC',
        id: 'DESC',
      },
    });
  }

  async update(
    id: number,
    dto: UpdateMovimientoFisicoDto,
    usuario: Usuario,
  ) {
    validarOperacionPermitida(usuario);
    const item = await this.findOne(id, usuario);

    Object.assign(item, {
      nombre_persona:
        dto.nombre_persona !== undefined
          ? this.normalizarTexto(dto.nombre_persona)
          : item.nombre_persona,
      documento_persona:
        dto.documento_persona !== undefined
          ? this.normalizarTexto(dto.documento_persona)
          : item.documento_persona,
      motivo:
        dto.motivo !== undefined
          ? this.normalizarTexto(dto.motivo)
          : item.motivo,
    });

    return this.repository.save(item);
  }

  async remove(id: number, usuario: Usuario) {
    validarOperacionPermitida(usuario);
    const item = await this.findOne(id, usuario);
    return this.repository.remove(item);
  }

  private async registrarRetiro(
    dto: CreateMovimientoFisicoDto,
    tramite: Tramite,
    usuario: Usuario,
    ultimoMovimiento: MovimientoFisico | null,
  ) {
    if (ultimoMovimiento?.tipo_movimiento === TipoMovimientoFisico.RETIRO) {
      throw new BadRequestException(
        'El trámite ya se encuentra retirado físicamente',
      );
    }

    const movimiento = this.repository.create({
      tramite_id: tramite.id,
      usuario_registro_id: usuario.id,
      tipo_movimiento: TipoMovimientoFisico.RETIRO,
      ubicacion_origen_id: tramite.ubicacion_fisica_id,
      ubicacion_destino_id: null,
      nombre_persona: this.normalizarTexto(dto.nombre_persona),
      documento_persona: this.normalizarTexto(dto.documento_persona),
      motivo: this.normalizarTexto(dto.motivo),
    });

    return this.repository.save(movimiento);
  }

  private async registrarDevolucion(
    dto: CreateMovimientoFisicoDto,
    tramite: Tramite,
    usuario: Usuario,
    ultimoMovimiento: MovimientoFisico | null,
  ) {
    if (!ultimoMovimiento || ultimoMovimiento.tipo_movimiento !== TipoMovimientoFisico.RETIRO) {
      throw new BadRequestException(
        'El trámite no se encuentra retirado físicamente',
      );
    }

    const ubicacionDestinoId = dto.ubicacion_destino_id ?? tramite.ubicacion_fisica_id;

    if (!ubicacionDestinoId) {
      throw new BadRequestException(
        'Debe seleccionar la ubicación física de destino',
      );
    }
    const ubicacionDestino = await this.validarUbicacionFisica(
      ubicacionDestinoId,
      usuario.institucion_id,
      tramite.id,
    );
    const movimiento = this.repository.create({
      tramite_id: tramite.id,
      usuario_registro_id: usuario.id,
      tipo_movimiento: TipoMovimientoFisico.DEVOLUCION,
      ubicacion_origen_id: null,
      ubicacion_destino_id: ubicacionDestino.id,
      nombre_persona: this.normalizarTexto(dto.nombre_persona),
      documento_persona: this.normalizarTexto(dto.documento_persona),
      motivo: this.normalizarTexto(dto.motivo),
    });

    const movimientoGuardado = await this.repository.save(movimiento);

    if (tramite.ubicacion_fisica_id !== ubicacionDestino.id) {
      tramite.ubicacion_fisica_id = ubicacionDestino.id;
      await this.tramiteRepository.save(tramite);
    }

    return movimientoGuardado;
  }

  private async registrarTraslado(
    dto: CreateMovimientoFisicoDto,
    tramite: Tramite,
    usuario: Usuario,
    ultimoMovimiento: MovimientoFisico | null,
  ) {
    if (ultimoMovimiento?.tipo_movimiento === TipoMovimientoFisico.RETIRO) {
      throw new BadRequestException(
        'No se puede trasladar el trámite porque se encuentra retirado físicamente',
      );
    }
    if (!dto.ubicacion_destino_id) {
      throw new BadRequestException(
        'Debe seleccionar la ubicación física de destino',
      );
    }
    const ubicacionDestino = await this.validarUbicacionFisica(
      dto.ubicacion_destino_id,
      usuario.institucion_id,
      tramite.id,
    );
    if (tramite.ubicacion_fisica_id === ubicacionDestino.id) {
      throw new BadRequestException(
        'La ubicación destino debe ser diferente a la ubicación actual',
      );
    }

    const movimiento = this.repository.create({
      tramite_id: tramite.id,
      usuario_registro_id: usuario.id,
      tipo_movimiento: TipoMovimientoFisico.TRASLADO,
      ubicacion_origen_id: tramite.ubicacion_fisica_id,
      ubicacion_destino_id: ubicacionDestino.id,
      nombre_persona: this.normalizarTexto(dto.nombre_persona),
      documento_persona: this.normalizarTexto(dto.documento_persona),
      motivo: this.normalizarTexto(dto.motivo),
    });

    const movimientoGuardado = await this.repository.save(movimiento);
    tramite.ubicacion_fisica_id = ubicacionDestino.id;
    await this.tramiteRepository.save(tramite);
    return movimientoGuardado;
  }

  private async obtenerUltimoMovimiento(tramiteId: number) {
    return this.repository.findOne({
      where: {
        tramite_id: tramiteId,
      },
      relations: {
        usuario_registro: true,
        ubicacion_origen: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
        ubicacion_destino: {
          estante_fisico: {
            ambiente_fisico: {
              institucion: true,
            },
          },
        },
      },
      order: {
        fecha_movimiento: 'DESC',
        id: 'DESC',
      },
    });
  }

  private async validarUbicacionFisica(
    id: number,
    institucionId: number,
    tramiteIdActual: number,
  ) {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: {
        id,
        estante_fisico: {
          ambiente_fisico: {
            institucion_id: institucionId,
          },
        },
      },
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

    const tramiteOcupante = await this.tramiteRepository.findOne({
      where: {
        ubicacion_fisica_id: id,
        id: Not(tramiteIdActual),
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

  private normalizarTexto(valor?: string | null): string | null {
    const texto = valor?.trim();
    if (!texto) {
      return null;
    }
    return texto.toUpperCase();
  }



  async obtenerEstadoFisicoTramite(
    tramiteId: number,
    usuario: Usuario,
  ) {
    const institucionId = obtenerInstitucionRestringida(usuario);
    const tramite = await this.tramiteRepository.findOne({
      where:
        institucionId === null
          ? { id: tramiteId }
          : {
              id: tramiteId,
              usuario_registro: { institucion_id: institucionId },
            },
      relations: {
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
      throw new BadRequestException('Trámite no encontrado');
    }

    if (!tramite.ubicacion_fisica_id) {
      return {
        tramite_id: tramite.id,
        estado_fisico: 'SIN_ASIGNAR',
        ubicacion_fisica: null,
        ultimo_movimiento: null,
        acciones_permitidas: [],
      };
    }

    const ultimoMovimiento = await this.obtenerUltimoMovimiento(tramite.id);

    if (!ultimoMovimiento) {
      return {
        tramite_id: tramite.id,
        estado_fisico: 'EN_ARCHIVO',
        ubicacion_fisica: tramite.ubicacion_fisica,
        ultimo_movimiento: null,
        acciones_permitidas: [
          TipoMovimientoFisico.RETIRO,
          TipoMovimientoFisico.TRASLADO,
        ],
      };
    }

    if (ultimoMovimiento.tipo_movimiento === TipoMovimientoFisico.RETIRO) {
      return {
        tramite_id: tramite.id,
        estado_fisico: 'RETIRADO',
        ubicacion_fisica: tramite.ubicacion_fisica,
        ultimo_movimiento: ultimoMovimiento,
        acciones_permitidas: [
          TipoMovimientoFisico.DEVOLUCION,
        ],
      };
    }

    return {
      tramite_id: tramite.id,
      estado_fisico: 'EN_ARCHIVO',
      ubicacion_fisica: tramite.ubicacion_fisica,
      ultimo_movimiento: ultimoMovimiento,
      acciones_permitidas: [
        TipoMovimientoFisico.RETIRO,
        TipoMovimientoFisico.TRASLADO,
      ],
    };
  }

  async buscarTramitesControlFisico(
    dto: PaginationQueryDto,
    usuario: Usuario,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim().toLowerCase() ?? '';

    if (!search) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        lastPage: 0,
      };
    }

    const queryBuilder = this.tramiteRepository
      .createQueryBuilder('tramite')
      .leftJoinAndSelect('tramite.ubicacion_fisica', 'ubicacion_fisica')
      .leftJoinAndSelect('ubicacion_fisica.estante_fisico', 'estante_fisico')
      .leftJoinAndSelect('estante_fisico.ambiente_fisico', 'ambiente_fisico')
      .leftJoinAndSelect('ambiente_fisico.institucion', 'institucion')
      .leftJoin('tramite.usuario_registro', 'usuario_registro');

    const institucionId = obtenerInstitucionRestringida(usuario);
    if (institucionId !== null) {
      queryBuilder.where(
        'usuario_registro.institucion_id = :institucionId',
        { institucionId },
      );
    }

    queryBuilder
      .andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(tramite.codigo_tramite) LIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('LOWER(tramite.nombres_apellidos) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('CAST(tramite.num_folder AS TEXT) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('CAST(tramite.num_tramite AS TEXT) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(tramite.codigo_catastral) LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('CAST(tramite.gestion AS TEXT) LIKE :search', {
              search: `%${search}%`,
            });
        }),
      )
      .orderBy('tramite.fecha_registro', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tramites, total] = await queryBuilder.getManyAndCount();

    const data = await Promise.all(
      tramites.map(async (tramite) => {
        if (!tramite.ubicacion_fisica_id) {
          return {
            ...tramite,
            estado_fisico: 'SIN_ASIGNAR',
            ultimo_movimiento: null,
            acciones_permitidas: [],
          };
        }

        const ultimoMovimiento = await this.obtenerUltimoMovimiento(tramite.id);

        if (!ultimoMovimiento) {
          return {
            ...tramite,
            estado_fisico: 'EN_ARCHIVO',
            ultimo_movimiento: null,
            acciones_permitidas: [
              TipoMovimientoFisico.RETIRO,
              TipoMovimientoFisico.TRASLADO,
            ],
          };
        }

        if (ultimoMovimiento.tipo_movimiento === TipoMovimientoFisico.RETIRO) {
          return {
            ...tramite,
            estado_fisico: 'RETIRADO',
            ultimo_movimiento: ultimoMovimiento,
            acciones_permitidas: [
              TipoMovimientoFisico.DEVOLUCION,
            ],
          };
        }

        return {
          ...tramite,
          estado_fisico: 'EN_ARCHIVO',
          ultimo_movimiento: ultimoMovimiento,
          acciones_permitidas: [
            TipoMovimientoFisico.RETIRO,
            TipoMovimientoFisico.TRASLADO,
          ],
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  private async verificarAccesoTramite(
    tramiteId: number,
    usuario: Usuario,
  ): Promise<void> {
    const institucionId = obtenerInstitucionRestringida(usuario);
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

  private validarInstitucionUbicacion(
    ubicacion: UbicacionFisica | null,
    usuario: Usuario,
  ): void {
    const institucionId =
      ubicacion?.estante_fisico?.ambiente_fisico?.institucion_id;

    if (institucionId !== usuario.institucion_id) {
      throw new BadRequestException(
        'La ubicación física del trámite no pertenece a la institución del usuario',
      );
    }
  }
}
