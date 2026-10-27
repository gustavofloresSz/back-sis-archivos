import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { CATALOGO_PERMISOS } from '../permiso/catalogo-permisos';
import { Permiso } from '../permiso/entities/permiso.entity';
import { PermisoRolDto } from './dto/create-rol.dto';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { Rol } from './entities/rol.entity';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
  ) {}

  async create(dto: CreateRolDto) {
    const nombre = dto.nombre.trim();
    await this.validarNombreDisponible(nombre);
    this.validarPermisos(dto.permisos);

    const rol = await this.rolRepository.save(
      this.rolRepository.create({
        nombre,
        descripcion: dto.descripcion?.trim() || null,
      }),
    );
    await this.reemplazarPermisos(rol.id, dto.permisos);
    return this.findOne(rol.id);
  }

  findAll() {
    return this.rolRepository.find({
      relations: { permisos: true },
      order: { id: 'ASC' },
    });
  }

  async findPaginated(dto: PaginationQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const query = this.rolRepository
      .createQueryBuilder('rol')
      .leftJoinAndSelect('rol.permisos', 'permisos')
      .orderBy('rol.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere(
        '(rol.nombre ILIKE :search OR rol.descripcion ILIKE :search)',
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

  async findOne(id: number) {
    const rol = await this.rolRepository.findOne({
      where: { id },
      relations: { permisos: true },
    });

    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }

    return rol;
  }

  async update(id: number, dto: UpdateRolDto) {
    const rol = await this.findOne(id);
    const nombre = dto.nombre?.trim() ?? rol.nombre;

    if (nombre !== rol.nombre) {
      await this.validarNombreDisponible(nombre, id);
    }

    rol.nombre = nombre;
    if (dto.descripcion !== undefined) {
      rol.descripcion = dto.descripcion?.trim() || null;
    }

    await this.rolRepository.save(rol);
    if (dto.permisos !== undefined) {
      this.validarPermisos(dto.permisos);
      await this.reemplazarPermisos(id, dto.permisos);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    const rol = await this.findOne(id);
    const usuariosAsignados = await this.usuarioRepository.count({
      where: { rol_id: id },
    });

    if (usuariosAsignados > 0) {
      throw new BadRequestException(
        'No se puede eliminar el rol porque tiene usuarios asignados',
      );
    }

    await this.rolRepository.remove(rol);
    return { message: 'Rol eliminado correctamente' };
  }

  private async validarNombreDisponible(
    nombre: string,
    idExcluido?: number,
  ): Promise<void> {
    const existente = await this.rolRepository.findOne({ where: { nombre } });

    if (existente && existente.id !== idExcluido) {
      throw new BadRequestException('Ya existe un rol con ese nombre');
    }
  }

  private validarPermisos(permisos: PermisoRolDto[]): void {
    const catalogo = new Set(
      CATALOGO_PERMISOS.map(({ recurso, accion }) => `${recurso}:${accion}`),
    );
    const seleccionados = new Set<string>();

    for (const permiso of permisos) {
      const clave = `${permiso.recurso}:${permiso.accion}`;
      if (!catalogo.has(clave)) {
        throw new BadRequestException(`El permiso ${clave} no está disponible`);
      }
      if (seleccionados.has(clave)) {
        throw new BadRequestException(`El permiso ${clave} está duplicado`);
      }
      seleccionados.add(clave);
    }
  }

  private async reemplazarPermisos(
    rolId: number,
    permisos: PermisoRolDto[],
  ): Promise<void> {
    await this.permisoRepository.delete({ rol_id: rolId });
    if (!permisos.length) return;

    await this.permisoRepository.save(
      permisos.map((permiso) =>
        this.permisoRepository.create({
          rol_id: rolId,
          recurso: permiso.recurso,
          accion: permiso.accion,
        }),
      ),
    );
  }
}
