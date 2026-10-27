import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEstanteFisicoDto } from './dto/create-estante-fisico.dto';
import { UpdateEstanteFisicoDto } from './dto/update-estante-fisico.dto';
import { EstanteFisico } from './entities/estante-fisico.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbienteFisico } from '../ambiente-fisico/entities/ambiente-fisico.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../usuarios/policies/acceso-institucional.policy';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Injectable()
export class EstanteFisicoService {
  constructor(
    @InjectRepository(EstanteFisico)
    private readonly estanteFisicoRepository: Repository<EstanteFisico>,

    @InjectRepository(AmbienteFisico)
    private readonly ambienteFisicoRepository: Repository<AmbienteFisico>,
  ) {}

  async create(
    createEstanteFisicoDto: CreateEstanteFisicoDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const ambienteFisico = await this.ambienteFisicoRepository.findOne({
      where: {
        id: createEstanteFisicoDto.ambiente_fisico_id,
        institucion_id: currentUser.institucion_id,
      },
    });

    if (!ambienteFisico) {
      throw new BadRequestException('El ambiente físico no existe');
    }

    const codigo = createEstanteFisicoDto.codigo.trim();
    const existeEstante = await this.estanteFisicoRepository.findOne({
      where: {
        ambiente_fisico_id: createEstanteFisicoDto.ambiente_fisico_id,
        codigo,
      },
    });
    if (existeEstante) {
      throw new BadRequestException(
        'Ya existe un estante físico con ese código en el ambiente seleccionado',
      );
    }

    const estanteFisico = this.estanteFisicoRepository.create({
      ...createEstanteFisicoDto,
      codigo,
      estado: createEstanteFisicoDto.estado ?? true,
    });

    return this.estanteFisicoRepository.save(estanteFisico);
  }

  findAll(currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    return this.estanteFisicoRepository.find({
      where:
        institucionId === null
          ? {}
          : { ambiente_fisico: { institucion_id: institucionId } },
      relations: {
        ambiente_fisico: {
          institucion: true,
        },
        ubicaciones_fisicas: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findPaginated(
    dto: PaginationQueryDto,
    currentUser: Usuario,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const query = this.estanteFisicoRepository
      .createQueryBuilder('estante')
      .leftJoinAndSelect('estante.ambiente_fisico', 'ambiente')
      .leftJoinAndSelect('ambiente.institucion', 'institucion')
      .orderBy('estante.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (institucionId !== null) {
      query.andWhere('ambiente.institucion_id = :institucionId', {
        institucionId,
      });
    }

    if (search) {
      query.andWhere(
        '(estante.codigo ILIKE :search OR ambiente.nombre ILIKE :search OR institucion.nombre ILIKE :search OR institucion.sigla ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const estanteFisico = await this.estanteFisicoRepository.findOne({
      where:
        institucionId === null
          ? { id }
          : { id, ambiente_fisico: { institucion_id: institucionId } },
      relations: {
        ambiente_fisico: {
          institucion: true,
        },
        ubicaciones_fisicas: true,
      },
    });

    if (!estanteFisico) {
      throw new NotFoundException('Estante físico no encontrado');
    }

    return estanteFisico;
  }

  async update(
    id: number,
    updateEstanteFisicoDto: UpdateEstanteFisicoDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const estanteFisico = await this.findOne(id, currentUser);

    if (updateEstanteFisicoDto.ambiente_fisico_id) {
      const ambienteFisico = await this.ambienteFisicoRepository.findOne({
        where: {
          id: updateEstanteFisicoDto.ambiente_fisico_id,
          institucion_id: currentUser.institucion_id,
        },
      });

      if (!ambienteFisico) {
        throw new BadRequestException('El ambiente físico no existe');
      }
    }

    const ambienteFisicoId = updateEstanteFisicoDto.ambiente_fisico_id ?? estanteFisico.ambiente_fisico_id;
    const codigo = updateEstanteFisicoDto.codigo?.trim() ?? estanteFisico.codigo;
    const existeEstante = await this.estanteFisicoRepository.findOne({
      where: {
        ambiente_fisico_id: ambienteFisicoId,
        codigo,
      },
    });

    if (existeEstante && existeEstante.id !== id) {
      throw new BadRequestException(
        'Ya existe un estante físico con ese código en el ambiente seleccionado',
      );
    }
    Object.assign(estanteFisico, {
      ...updateEstanteFisicoDto,
      ambiente_fisico_id: ambienteFisicoId,
      codigo,
    });

    return this.estanteFisicoRepository.save(estanteFisico);
  }

  async remove(id: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const estanteFisico = await this.findOne(id, currentUser);
    estanteFisico.estado = false;
    await this.estanteFisicoRepository.save(estanteFisico);
    return { message: 'Estante físico desactivado correctamente' };
  }
}
