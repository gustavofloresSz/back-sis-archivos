import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateComprobantePagoDto } from './dto/create-comprobante_pago.dto';
import { UpdateComprobantePagoDto } from './dto/update-comprobante_pago.dto';
import { ComprobantePago } from './entities/comprobante_pago.entity';
import { Tramite } from '../../tramite/entities/tramite.entity';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import {
  obtenerInstitucionRestringida,
  validarOperacionPermitida,
} from '../../../usuarios/policies/acceso-institucional.policy';

@Injectable()
export class ComprobantePagoService {
  constructor(
    @InjectRepository(ComprobantePago)
    private readonly repository: Repository<ComprobantePago>,
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
  ) { }

  async create(dto: CreateComprobantePagoDto, currentUser: Usuario) {
    validarOperacionPermitida(currentUser);
    await this.verificarAccesoTramite(dto.tramite_id, currentUser);
    if (dto.monto <= 0) {
      throw new BadRequestException('El monto del comprobante debe ser mayor a 0');
    }
    const existeComprobante = await this.repository.findOneBy({numero_comprobante: dto.numero_comprobante,});
    if (existeComprobante) {
      throw new BadRequestException('El número de comprobante ya existe');
    }
    return this.repository.save(this.repository.create({
        ...dto,
        concepto: dto.concepto || null,
      }),
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
      relations: ['tramite'],
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
      relations: ['tramite'],
    });
    if (!item) throw new NotFoundException('Comprobante no encontrado');
    return item;
  }

  async update(
    id: number,
    dto: UpdateComprobantePagoDto,
    currentUser: Usuario,
  ) {
    validarOperacionPermitida(currentUser);
    const item = await this.findOne(id, currentUser);

    if (dto.monto !== undefined && Number(dto.monto) <= 0) {
      throw new BadRequestException(
        'El monto del comprobante debe ser mayor a 0',
      );
    }

    if (dto.numero_comprobante !== undefined) {
      const numeroComprobante = dto.numero_comprobante.trim();
      const existente = await this.repository.findOneBy({
        numero_comprobante: numeroComprobante,
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException('El número de comprobante ya existe');
      }

      dto.numero_comprobante = numeroComprobante;
    }

    Object.assign(item, dto, {
      concepto:
        dto.concepto === undefined ? item.concepto : dto.concepto?.trim() || null,
    });

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
