import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTipoTramiteDto } from './dto/create-tipo_tramite.dto';
import { UpdateTipoTramiteDto } from './dto/update-tipo_tramite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { TipoTramite } from './entities/tipo_tramite.entity';

import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
@Injectable()
export class TipoTramiteService {
  constructor(
    @InjectRepository(TipoTramite)
    private tipoTramiteRepository: Repository<TipoTramite>,
  ) {}

  async create(createTipoTramiteDto: CreateTipoTramiteDto) {
    const exists = await this.tipoTramiteRepository.findOne({
      where: { nombre: createTipoTramiteDto.nombre },
    });
    if (exists) {
      throw new BadRequestException('El tipo de trámite ya existe');
    }
    const tipoTramite = this.tipoTramiteRepository.create(createTipoTramiteDto);
    return await this.tipoTramiteRepository.save(tipoTramite);
  }

  async findAll() {
    return await this.tipoTramiteRepository.find({
      // order: {
      //   id: 'DESC',
      // },
      order: {
        segmento: 'ASC',
        nombre: 'ASC',
      },
    });
  }

  async findPaginated(dto: PaginationQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const [data, total] = await this.tipoTramiteRepository.findAndCount({
      where: search
        ? [
            { nombre: ILike(`%${search}%`) },
            { segmento: ILike(`%${search}%`) },
          ]
        : {},
      order: {
        id: 'ASC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(id: number) {
    const tipoTramite = await this.tipoTramiteRepository.findOne({
      where: { id },
    });

    if (!tipoTramite) {
      throw new BadRequestException('Tipo de trámite no encontrado',);
    }
    return tipoTramite;
  }

  async update(id: number,updateTipoTramiteDto: UpdateTipoTramiteDto,) {
    const tipoTramite =await this.tipoTramiteRepository.findOne({
        where: { id },
    });

    if (!tipoTramite) {
      throw new BadRequestException('Tipo de trámite no encontrado',);
    }
    if (updateTipoTramiteDto.nombre &&updateTipoTramiteDto.nombre !==tipoTramite.nombre) {
      const exists = await this.tipoTramiteRepository.findOne({
        where: {
          nombre:
          updateTipoTramiteDto.nombre,
        },
      });
      if (exists) {
        throw new BadRequestException('El tipo de trámite ya existe',);
      }
    }
    Object.assign(tipoTramite,updateTipoTramiteDto,);
    return await this.tipoTramiteRepository.save(tipoTramite,);
  }

  async remove(id: number) {
    const tipoTramite = await this.tipoTramiteRepository.findOne({
      where: { id },
      relations: ['tramites'],
    });

    if (!tipoTramite) {
      throw new BadRequestException('Tipo de trámite no encontrado',);
    }

    tipoTramite.estado = false;
    await this.tipoTramiteRepository.save(tipoTramite);
    return {
      message:'Tipo de trámite desactivado correctamente',
    };
  }
}
