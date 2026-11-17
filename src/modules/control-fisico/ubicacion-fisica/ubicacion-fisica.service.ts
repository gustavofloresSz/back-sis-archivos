import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUbicacionFisicaDto } from './dto/create-ubicacion-fisica.dto';
import { UpdateUbicacionFisicaDto } from './dto/update-ubicacion-fisica.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstanteFisico } from '../estante-fisico/entities/estante-fisico.entity';
import { UbicacionFisica } from './entities/ubicacion-fisica.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../usuarios/policies/acceso-institucional.policy';

@Injectable()
export class UbicacionFisicaService {
  constructor(
    @InjectRepository(UbicacionFisica)
    private readonly repository: Repository<UbicacionFisica>,

    @InjectRepository(EstanteFisico)
    private readonly estanteFisicoRepository: Repository<EstanteFisico>,
  ) {}

  async create(dto: CreateUbicacionFisicaDto, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const estante = await this.estanteFisicoRepository.findOne({
      where: {
        id: dto.estante_fisico_id,
        ambiente_fisico: {
          institucion_id: currentUser.institucion_id,
        },
      },
    });

    if (!estante) {
      throw new BadRequestException('El estante físico no existe');
    }

    const fila = this.normalizarTexto(dto.fila);
    const columna = this.normalizarTexto(dto.columna);

    const existeUbicacion = await this.repository.findOne({
      where: {
        estante_fisico_id: dto.estante_fisico_id,
        fila,
        columna,
      },
    });

    if (existeUbicacion) {
      throw new BadRequestException(
        'Ya existe una ubicación física con esa fila y columna en el estante seleccionado',
      );
    }

    const ubicacion = this.repository.create({
      ...dto,
      fila,
      columna,
      estado: dto.estado ?? true,
    });

    return this.repository.save(ubicacion);
  }

  async findAll(currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const ubicaciones = await this.repository.find({
      where:
        institucionId === null
          ? {}
          : {
              estante_fisico: {
                ambiente_fisico: { institucion_id: institucionId },
              },
            },
      relations: {
        estante_fisico: { ambiente_fisico: { institucion: true } },
      },
      order: { id: 'DESC' },
    });

    if (ubicaciones.length === 0) {
      return [];
    }

    const ocupaciones = await this.repository
      .createQueryBuilder('ubicacion')
      .leftJoin('ubicacion.tramites', 'tramite')
      .select('ubicacion.id', 'ubicacion_id')
      .addSelect('COUNT(tramite.id)', 'cantidad_tramites')
      .where('ubicacion.id IN (:...ids)', {
        ids: ubicaciones.map((ubicacion) => ubicacion.id),
      })
      .groupBy('ubicacion.id')
      .getRawMany<{ ubicacion_id: string; cantidad_tramites: string }>();

    const cantidadPorUbicacion = new Map(
      ocupaciones.map((item) => [
        Number(item.ubicacion_id),
        Number(item.cantidad_tramites),
      ]),
    );

    return ubicaciones.map((ubicacion) => ({
      ...ubicacion,
      ocupada: (cantidadPorUbicacion.get(ubicacion.id) ?? 0) > 0,
    }));
  }

  async findOne(id: number, currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
    const item = await this.repository.findOne({
      where:
        institucionId === null
          ? { id }
          : {
              id,
              estante_fisico: {
                ambiente_fisico: { institucion_id: institucionId },
              },
            },
      relations: {
        estante_fisico: { ambiente_fisico: { institucion: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Ubicación física no encontrada');
    }

    return item;
  }

  async update(
    id: number,
    dto: UpdateUbicacionFisicaDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const item = await this.findOne(id, currentUser);

    if (dto.estante_fisico_id) {
      const estante = await this.estanteFisicoRepository.findOne({
        where: {
          id: dto.estante_fisico_id,
          ambiente_fisico: {
            institucion_id: currentUser.institucion_id,
          },
        },
      });

      if (!estante) {
        throw new BadRequestException('El estante físico no existe');
      }
    }

    const estanteFisicoId = dto.estante_fisico_id ?? item.estante_fisico_id;
    const fila = dto.fila ? this.normalizarTexto(dto.fila) : item.fila;
    const columna = dto.columna
      ? this.normalizarTexto(dto.columna)
      : item.columna;

    const existeUbicacion = await this.repository.findOne({
      where: {
        estante_fisico_id: estanteFisicoId,
        fila,
        columna,
      },
    });

    if (existeUbicacion && existeUbicacion.id !== id) {
      throw new BadRequestException(
        'Ya existe una ubicación física con esa fila y columna en el estante seleccionado',
      );
    }

    Object.assign(item, {
      ...dto,
      estante_fisico_id: estanteFisicoId,
      fila,
      columna,
    });

    return this.repository.save(item);
  }

  async remove(id: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    const item = await this.findOne(id, currentUser);
    return this.repository.remove(item);
  }

  private normalizarTexto(valor: string): string {
    return valor.trim().toUpperCase();
  }
}
