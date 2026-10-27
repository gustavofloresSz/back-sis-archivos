import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEstadoTramiteDto } from './dto/create-estado_tramite.dto';
import { UpdateEstadoTramiteDto } from './dto/update-estado_tramite.dto';
import { EstadoTramite } from './entities/estado_tramite.entity';
@Injectable()
export class EstadoTramiteService {
  constructor(
    @InjectRepository(EstadoTramite)
    private readonly repository: Repository<EstadoTramite>
  ) { }

  async create(dto: CreateEstadoTramiteDto) {
    if (await this.repository.findOneBy({
      nombre: dto.nombre
    })) throw new BadRequestException('El estado de trámite ya existe');

    return this.repository.save(this.repository.create(dto));
  }

  findAll() {
    return this.repository.find({
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number) {
    const item = await this.repository.findOneBy({ id });
    if (!item) throw new NotFoundException('Estado de trámite no encontrado');
    return item;
  }

  async update(id: number, dto: UpdateEstadoTramiteDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repository.save(item);
  }

  async remove(id: number) {
    return this.repository.remove(
      await this.findOne(id)
    );
  }
}
