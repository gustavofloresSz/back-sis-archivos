import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Raw, Repository } from 'typeorm';
import { CreateClasificacionTramiteDto } from './dto/create-clasificacion_tramite.dto';
import { UpdateClasificacionTramiteDto } from './dto/update-clasificacion_tramite.dto';
import { ClasificacionTramite } from './entities/clasificacion_tramite.entity';

import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
@Injectable()
export class ClasificacionTramiteService {
  constructor(
    @InjectRepository(ClasificacionTramite)
    private readonly repository: Repository<ClasificacionTramite>,
  ) {}

  async create(dto: CreateClasificacionTramiteDto) {
    const nombre = dto.nombre.trim();
    if (await this.buscarPorNombre(nombre)) {
      throw new BadRequestException('La clasificación ya existe');
    }

    return this.repository.save(
      this.repository.create({
        ...dto,
        nombre,
        estado: dto.estado ?? true,
      }),
    );
  }

  findAll() {
    return this.repository.find({ order: { nombre: 'ASC' } });
  }

  async findPaginated(dto: PaginationQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const [data, total] = await this.repository.findAndCount({
      where: search ? { nombre: ILike(`%${search}%`) } : {},
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
    if (!item) {
      throw new NotFoundException('Clasificación no encontrada');
    }
    return item;
  }

  async update(id: number, dto: UpdateClasificacionTramiteDto) {
    const item = await this.findOne(id);
    const nombre = dto.nombre?.trim();

    if (nombre) {
      const existente = await this.buscarPorNombre(nombre);
      if (existente && existente.id !== id) {
        throw new BadRequestException('La clasificación ya existe');
      }
    }

    Object.assign(item, {
      ...dto,
      ...(nombre ? { nombre } : {}),
    });
    return this.repository.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    item.estado = false;
    await this.repository.save(item);
    return { message: 'Clasificación desactivada correctamente' };
  }

  private buscarPorNombre(nombre: string) {
    return this.repository.findOne({
      where: {
        nombre: Raw(
          (alias) => `LOWER(${alias}) = LOWER(:nombre)`,
          { nombre },
        ),
      },
    });
  }
}
