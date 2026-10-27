import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateConocimientoTramiteDto } from './dto/create-conocimiento_tramite.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConocimientoTramite } from './entities/conocimiento_tramite.entity';
import { Repository } from 'typeorm';
import { UpdateConocimientoTramiteDto } from './dto/update-conocimiento_tramite.dto';

@Injectable()
export class ConocimientoTramiteService {
  constructor(
    @InjectRepository(ConocimientoTramite)
    private readonly conocimientoRepository: Repository<ConocimientoTramite>,
  ) {}

  async create(
    createConocimientoTramiteDto: CreateConocimientoTramiteDto,
  ): Promise<ConocimientoTramite> {
    const existe = await this.conocimientoRepository.findOne({
      where: {
        codigo: createConocimientoTramiteDto.codigo,
      },
    });

    if (existe) {
      throw new ConflictException(
        'Ya existe un conocimiento de trámite con ese código',
      );
    }

    const conocimiento = this.conocimientoRepository.create(
      createConocimientoTramiteDto,
    );

    return await this.conocimientoRepository.save(conocimiento);
  }

  async update(id: number, updateConocimientoTramiteDto: UpdateConocimientoTramiteDto,): Promise<ConocimientoTramite> {
    const conocimiento = await this.conocimientoRepository.findOne({
      where: { id },
    });

    if (!conocimiento) {
      throw new NotFoundException('No se encontró el conocimiento del trámite',);
    }

    if (updateConocimientoTramiteDto.codigo && updateConocimientoTramiteDto.codigo !== conocimiento.codigo) {
      const codigoExistente = await this.conocimientoRepository.findOne({
        where: {
          codigo: updateConocimientoTramiteDto.codigo,
        },
      });

      if (codigoExistente) {
        throw new ConflictException('Ya existe un conocimiento de trámite con ese código',);
      }
    }
    const conocimientoActualizado =this.conocimientoRepository.merge(
      conocimiento,
      updateConocimientoTramiteDto,
    );
    return await this.conocimientoRepository.save(
      conocimientoActualizado,
    );
  }


  async consultarRequisitoPorCodigo(codigo: string) {
    const conocimiento = await this.conocimientoRepository.findOne({
      where: {
        codigo,
        estado: true,
      },
      select: {
        nombre: true,
        requisitos: true,
      },
    });

    if (!conocimiento) {
      throw new NotFoundException('No se encontró información para el trámite consultado',);
    }
    return conocimiento;
  }

}
