import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../rol/entities/rol.entity';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { Permiso } from './entities/permiso.entity';
import { RecursoPermiso } from './enums/recurso-permiso.enum';
import { CATALOGO_PERMISOS } from './catalogo-permisos';

@Injectable()
export class PermisoService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async create(dto: CreatePermisoDto) {
    await this.validarRol(dto.rol_id);
    const accion = this.normalizarAccion(dto.accion);
    this.validarPermisoCatalogado(dto.recurso, accion);
    await this.validarPermisoDisponible(dto.rol_id, dto.recurso, accion);

    return this.permisoRepository.save(
      this.permisoRepository.create({ ...dto, accion }),
    );
  }

  findAll() {
    return this.permisoRepository.find({
      relations: { rol: true },
      order: { rol_id: 'ASC', recurso: 'ASC', accion: 'ASC' },
    });
  }

  findCatalogo() {
    return CATALOGO_PERMISOS;
  }

  findByRol(rolId: number) {
    return this.permisoRepository.find({
      where: { rol_id: rolId },
      order: { recurso: 'ASC', accion: 'ASC' },
    });
  }

  async findOne(id: number) {
    const permiso = await this.permisoRepository.findOne({
      where: { id },
      relations: { rol: true },
    });

    if (!permiso) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return permiso;
  }

  async update(id: number, dto: UpdatePermisoDto) {
    const permiso = await this.findOne(id);
    const rolId = dto.rol_id ?? permiso.rol_id;
    const recurso = dto.recurso ?? permiso.recurso;
    const accion = dto.accion
      ? this.normalizarAccion(dto.accion)
      : permiso.accion;

    this.validarPermisoCatalogado(recurso, accion);

    if (dto.rol_id !== undefined) {
      await this.validarRol(rolId);
    }

    await this.validarPermisoDisponible(
      rolId,
      recurso,
      accion,
      permiso.id,
    );

    permiso.rol_id = rolId;
    permiso.recurso = recurso;
    permiso.accion = accion;
    return this.permisoRepository.save(permiso);
  }

  async remove(id: number) {
    const permiso = await this.findOne(id);
    await this.permisoRepository.remove(permiso);
    return { message: 'Permiso eliminado correctamente' };
  }

  private async validarRol(rolId: number): Promise<void> {
    if (!(await this.rolRepository.existsBy({ id: rolId }))) {
      throw new BadRequestException('El rol seleccionado no existe');
    }
  }

  private async validarPermisoDisponible(
    rolId: number,
    recurso: RecursoPermiso,
    accion: string,
    idExcluido?: number,
  ): Promise<void> {
    const existente = await this.permisoRepository.findOne({
      where: { rol_id: rolId, recurso, accion },
    });

    if (existente && existente.id !== idExcluido) {
      throw new BadRequestException(
        'El rol ya tiene registrada esa acción para el recurso seleccionado',
      );
    }
  }

  private normalizarAccion(accion: string): string {
    return accion.trim().toLowerCase();
  }

  private validarPermisoCatalogado(
    recurso: RecursoPermiso,
    accion: string,
  ): void {
    const existe = CATALOGO_PERMISOS.some(
      (permiso) =>
        permiso.recurso === recurso && permiso.accion === accion,
    );

    if (!existe) {
      throw new BadRequestException(
        'La acción no está disponible para el recurso seleccionado',
      );
    }
  }
}
