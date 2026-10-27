import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateInstitucionDto } from './dto/create-institucion.dto';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';
import { Institucion } from './entities/institucion.entity';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Injectable()
export class InstitucionService {
  constructor(@InjectRepository(Institucion) private readonly repository: Repository<Institucion>) {}

  async create(dto: CreateInstitucionDto) {
    const nombre = dto.nombre.trim();
    const sigla = dto.sigla.trim().toUpperCase();

    if (await this.repository.findOneBy({ sigla })) {
      throw new BadRequestException('La sigla de la institución ya existe');
    }
    return this.repository.save(this.repository.create({ nombre, sigla }));
  }

  findAll() { return this.repository.find({ order: { id: 'ASC' } }); }

  async findPaginated(dto: PaginationQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const [data, total] = await this.repository.findAndCount({
      where: search
        ? [
            { nombre: ILike(`%${search}%`) },
            { sigla: ILike(`%${search}%`) },
          ]
        : {},
      order: { id: 'ASC' },
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
    const item = await this.repository.findOneBy({ id });
    if (!item) throw new NotFoundException('Institución no encontrada');
    return item;
  }

  async update(id: number, dto: UpdateInstitucionDto) {
    const item = await this.findOne(id);
    const nombre = dto.nombre?.trim() ?? item.nombre;
    const sigla = dto.sigla?.trim().toUpperCase() ?? item.sigla;
    const existente = await this.repository.findOneBy({ sigla });

    if (existente && existente.id !== id) {
      throw new BadRequestException('La sigla de la institución ya existe');
    }

    Object.assign(item, { nombre, sigla });
    return this.repository.save(item);
  }

  async remove(id: number) { return this.repository.remove(await this.findOne(id)); }
}
