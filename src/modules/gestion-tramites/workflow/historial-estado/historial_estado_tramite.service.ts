import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHistorialEstadoTramiteDto } from './dto/create-historial_estado_tramite.dto';
import { UpdateHistorialEstadoTramiteDto } from './dto/update-historial_estado_tramite.dto';
import { HistorialEstadoTramite } from './entities/historial_estado_tramite.entity';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../../usuarios/policies/acceso-institucional.policy';
@Injectable()
export class HistorialEstadoTramiteService {
  constructor(
    @InjectRepository(HistorialEstadoTramite)
    private readonly repository: Repository<HistorialEstadoTramite>,
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
  ) { }

  async create(dto: CreateHistorialEstadoTramiteDto, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    await this.verificarAccesoTramite(dto.tramite_id, currentUser);

    return this.repository.save(
      this.repository.create({
        ...dto,
        usuario_id: currentUser.id,
      })
    );
  }

  findAll(currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
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
        usuario: true,
        estado_anterior: true,
        estado_nuevo: true,
      },
      order: { id: 'DESC' }
    });
  }

  async findOne(id: number, currentUser: Usuario) {
    const institucionId = obtenerInstitucionRestringida(currentUser);
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
        usuario: true,
        estado_anterior: true,
        estado_nuevo: true,
      }
    });
    if (!item) throw new NotFoundException('Historial no encontrado');
    return item;
  }

  async update(
    id: number,
    dto: UpdateHistorialEstadoTramiteDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const item = await this.findOne(id, currentUser);
    await this.verificarAccesoTramite(
      dto.tramite_id ?? item.tramite_id,
      currentUser,
    );
    Object.assign(item, dto, { usuario_id: currentUser.id });
    return this.repository.save(item);
  }

  async remove(id: number, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    return this.repository.remove(
      await this.findOne(id, currentUser)
    );
  }

  private async verificarAccesoTramite(
    tramiteId: number,
    currentUser: Usuario,
  ): Promise<void> {
    const existe = await this.tramiteRepository.exists({
      where: {
        id: tramiteId,
        usuario_registro: {
          institucion_id: currentUser.institucion_id,
        },
      },
    });

    if (!existe) {
      throw new NotFoundException('Trámite no encontrado');
    }
  }
}
