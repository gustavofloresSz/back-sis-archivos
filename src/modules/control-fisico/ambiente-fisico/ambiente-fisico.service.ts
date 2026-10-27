import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAmbienteFisicoDto } from './dto/create-ambiente-fisico.dto';
import { UpdateAmbienteFisicoDto } from './dto/update-ambiente-fisico.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institucion } from '../../organizacion/institucion/entities/institucion.entity';
import { AmbienteFisico } from './entities/ambiente-fisico.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../usuarios/policies/acceso-institucional.policy';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Injectable()
export class AmbienteFisicoService {
  constructor(
    @InjectRepository(AmbienteFisico)
    private readonly ambienteFisicoRepository: Repository<AmbienteFisico>,

    @InjectRepository(Institucion)
    private readonly institucionRepository: Repository<Institucion>,
  ) {}

  async create(
    createAmbienteFisicoDto: CreateAmbienteFisicoDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const institucionId =
      createAmbienteFisicoDto.institucion_id ?? currentUser.institucion_id;
    this.validarInstitucion(institucionId, currentUser);
    const institucion = await this.institucionRepository.findOne({
      where: { id: institucionId },
    });

    if (!institucion) {
      throw new BadRequestException('La institución no existe');
    }

    const nombre = createAmbienteFisicoDto.nombre.trim();

    const existeAmbiente = await this.ambienteFisicoRepository.findOne({
      where: {
        institucion_id: institucionId,
        nombre,
      },
    });

    if (existeAmbiente) {
      throw new BadRequestException(
        'Ya existe un ambiente físico con ese nombre en la institución seleccionada',
      );
    }

    const ambienteFisico = this.ambienteFisicoRepository.create({
      ...createAmbienteFisicoDto,
      institucion_id: institucionId,
      nombre,
      estado: createAmbienteFisicoDto.estado ?? true,
    });

    return this.ambienteFisicoRepository.save(ambienteFisico);
  }

  findAll(currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    return this.ambienteFisicoRepository.find({
      where: institucionId === null ? {} : { institucion_id: institucionId },
      relations: {
        institucion: true,
        estantes_fisicos: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number, currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const ambienteFisico = await this.ambienteFisicoRepository.findOne({
      where:
        institucionId === null ? { id } : { id, institucion_id: institucionId },
      relations: {
        institucion: true,
        estantes_fisicos: true,
      },
    });
    if (!ambienteFisico) {
      throw new NotFoundException('Ambiente físico no encontrado');
    }

    return ambienteFisico;
  }

  async update(
    id: number,
    updateAmbienteFisicoDto: UpdateAmbienteFisicoDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const ambienteFisico = await this.findOne(id, currentUser);
    if (updateAmbienteFisicoDto.institucion_id) {
      this.validarInstitucion(
        updateAmbienteFisicoDto.institucion_id,
        currentUser,
      );
      const institucion = await this.institucionRepository.findOne({
        where: { id: updateAmbienteFisicoDto.institucion_id },
      });
      if (!institucion) {
        throw new BadRequestException('La institución no existe');
      }
    }

    const institucionId = updateAmbienteFisicoDto.institucion_id ?? ambienteFisico.institucion_id;
    const nombre = updateAmbienteFisicoDto.nombre?.trim() ?? ambienteFisico.nombre;
    const existeAmbiente = await this.ambienteFisicoRepository.findOne({
      where: {
        institucion_id: institucionId,
        nombre,
      },
    });
    if (existeAmbiente && existeAmbiente.id !== id) {
      throw new BadRequestException(
        'Ya existe un ambiente físico con ese nombre en la institución seleccionada',
      );
    }

    Object.assign(ambienteFisico, {
      ...updateAmbienteFisicoDto,
      nombre,
      institucion_id: institucionId,
    });
    return this.ambienteFisicoRepository.save(ambienteFisico);
  }

  async remove(id: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const ambienteFisico = await this.findOne(id, currentUser);
    ambienteFisico.estado = false;
    await this.ambienteFisicoRepository.save(ambienteFisico);
    return { message: 'Ambiente físico desactivado correctamente' };
  }

  async findPaginated(
    dto: PaginationQueryDto,
    currentUser: Usuario,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const query = this.ambienteFisicoRepository
      .createQueryBuilder('ambiente')
      .leftJoinAndSelect('ambiente.institucion', 'institucion')
      .orderBy('ambiente.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (institucionId !== null) {
      query.andWhere('ambiente.institucion_id = :institucionId', {
        institucionId,
      });
    }

    if (search) {
      query.andWhere(
        '(ambiente.nombre ILIKE :search OR institucion.nombre ILIKE :search OR institucion.sigla ILIKE :search)',
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

  private validarInstitucion(
    institucionId: number,
    currentUser: Usuario,
  ): void {
    if (institucionId !== currentUser.institucion_id) {
      throw new BadRequestException(
        'La institución seleccionada no corresponde al usuario actual',
      );
    }
  }
}
