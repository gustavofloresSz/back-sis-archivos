import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, Repository } from 'typeorm';
import { Institucion } from '../organizacion/institucion/entities/institucion.entity';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { RecursoPermiso } from './permiso/enums/recurso-permiso.enum';
import {
  esAdministradorGeneral,
  tienePermiso,
} from './policies/acceso-institucional.policy';
import { Rol } from './rol/entities/rol.entity';

import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(Institucion)
    private readonly institucionRepository: Repository<Institucion>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async createUser(dto: CreateUsuarioDto, currentUser: Usuario) {
    this.validarPermisoUsuario(currentUser, 'crear');
    await this.validarRolAsignable(dto.rol_id, currentUser);

    const institucionId = this.resolverInstitucionObjetivo(
      dto.institucion_id,
      currentUser,
    );

    if (await this.userRepository.existsBy({ login: dto.login })) {
      throw new BadRequestException('El usuario ya existe');
    }

    if (!(await this.institucionRepository.existsBy({ id: institucionId }))) {
      throw new BadRequestException('Institución no encontrada');
    }

    const { password, ...datosUsuario } = dto;
    const usuario = this.userRepository.create({
      ...datosUsuario,
      institucion_id: institucionId,
      estado: dto.estado ?? true,
      password: await bcrypt.hash(password, 10),
    });

    return this.userRepository.save(usuario);
  }

  getAllUsers(currentUser: Usuario) {
    this.validarPermisoUsuario(currentUser, 'ver');

    return this.userRepository.find({
      where: esAdministradorGeneral(currentUser)
        ? {}
        : { institucion_id: currentUser.institucion_id },
      relations: { institucion: true, rol: { permisos: true } },
      order: { id: 'ASC' },
    });
  }

  async getPaginatedUsers(
    dto: PaginationQueryDto,
    currentUser: Usuario,
  ) {
    this.validarPermisoUsuario(currentUser, 'ver');
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const search = dto.search?.trim();
    const query = this.userRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.institucion', 'institucion')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .leftJoinAndSelect('rol.permisos', 'permisos')
      .orderBy('usuario.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!esAdministradorGeneral(currentUser)) {
      query.andWhere('usuario.institucion_id = :institucionId', {
        institucionId: currentUser.institucion_id,
      });
    }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('usuario.nombre_completo ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('usuario.login ILIKE :search', { search: `%${search}%` })
            .orWhere('rol.nombre ILIKE :search', { search: `%${search}%` })
            .orWhere('institucion.nombre ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('institucion.sigla ILIKE :search', {
              search: `%${search}%`,
            });
        }),
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

  async getRolesAsignables(currentUser: Usuario) {
    const roles = await this.rolRepository.find({
      relations: { permisos: true },
      order: { nombre: 'ASC' },
    });

    return roles
      .filter(
        (rol) =>
          esAdministradorGeneral(currentUser) ||
          !(rol.permisos ?? []).some(
            (permiso) =>
              permiso.recurso === RecursoPermiso.INSTITUCION &&
              permiso.accion === 'acceso_global',
          ),
      )
      .map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }));
  }

  async cambiarPassword(
    usuarioId: number,
    dto: CambiarPasswordDto,
  ) {
    const usuario = await this.userRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :usuarioId', { usuarioId })
      .getOne();

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!(await bcrypt.compare(dto.password_actual, usuario.password))) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (dto.password_nueva !== dto.confirmar_password_nueva) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden');
    }

    if (await bcrypt.compare(dto.password_nueva, usuario.password)) {
      throw new BadRequestException(
        'La contraseña nueva debe ser diferente de la actual',
      );
    }

    usuario.password = await bcrypt.hash(dto.password_nueva, 10);
    await this.userRepository.save(usuario);
    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateUser(
    id: number,
    dto: UpdateUsuarioDto,
    currentUser: Usuario,
  ) {
    this.validarPermisosActualizacion(dto, currentUser);
    const usuario = await this.userRepository.findOne({
      where: { id },
      relations: { rol: { permisos: true } },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    this.validarUsuarioGestionable(usuario, currentUser);

    if (dto.estado === false && currentUser.id === id) {
      throw new BadRequestException('No puedes desactivar tu propio usuario');
    }

    if (
      currentUser.id === id &&
      dto.rol_id !== undefined &&
      dto.rol_id !== usuario.rol_id
    ) {
      throw new BadRequestException(
        'No puedes cambiar el rol de tu propio usuario',
      );
    }

    const nuevoRol =
      dto.rol_id !== undefined
        ? await this.validarRolAsignable(dto.rol_id, currentUser)
        : null;

    if (
      dto.login &&
      dto.login !== usuario.login &&
      (await this.userRepository.existsBy({ login: dto.login }))
    ) {
      throw new BadRequestException('El usuario ya existe');
    }

    if (dto.institucion_id !== undefined) {
      this.resolverInstitucionObjetivo(dto.institucion_id, currentUser);
      if (
        !(await this.institucionRepository.existsBy({
          id: dto.institucion_id,
        }))
      ) {
        throw new BadRequestException('Institución no encontrada');
      }
    }

    const datosActualizacion = { ...dto };
    if (datosActualizacion.password) {
      datosActualizacion.password = await bcrypt.hash(
        datosActualizacion.password,
        10,
      );
    }

    Object.assign(usuario, datosActualizacion);
    if (nuevoRol) {
      usuario.rol_id = nuevoRol.id;
      usuario.rol = nuevoRol;
    }

    await this.userRepository.save(usuario);
    return this.userRepository.findOne({
      where: { id },
      relations: { institucion: true, rol: { permisos: true } },
    });
  }

  private validarPermisoUsuario(
    currentUser: Usuario,
    accion: string,
  ): void {
    if (!tienePermiso(currentUser, RecursoPermiso.USUARIO, accion)) {
      throw new ForbiddenException(
        `No tienes permiso para ${accion} usuarios`,
      );
    }
  }

  private validarPermisosActualizacion(
    dto: UpdateUsuarioDto,
    currentUser: Usuario,
  ): void {
    const modificaDatos = [
      dto.nombre_completo,
      dto.login,
      dto.password,
      dto.institucion_id,
      dto.estado,
      dto.rol_id,
    ].some((valor) => valor !== undefined);

    if (modificaDatos) {
      this.validarPermisoUsuario(currentUser, 'editar');
    }

    if (!modificaDatos) {
      throw new BadRequestException('No se enviaron campos para actualizar');
    }
  }

  private async validarRolAsignable(
    rolId: number,
    currentUser: Usuario,
  ): Promise<Rol> {
    const rol = await this.rolRepository.findOne({
      where: { id: rolId },
      relations: { permisos: true },
    });

    if (!rol) {
      throw new BadRequestException('Rol no encontrado');
    }

    const concedeAccesoGlobal = (rol.permisos ?? []).some(
      (permiso) =>
        permiso.recurso === RecursoPermiso.INSTITUCION &&
        permiso.accion === 'acceso_global',
    );

    if (concedeAccesoGlobal && !esAdministradorGeneral(currentUser)) {
      throw new ForbiddenException(
        'No puedes asignar un rol con acceso global',
      );
    }

    return rol;
  }

  private validarUsuarioGestionable(
    usuario: Usuario,
    currentUser: Usuario,
  ): void {
    if (esAdministradorGeneral(currentUser)) {
      return;
    }

    if (usuario.institucion_id !== currentUser.institucion_id) {
      throw new ForbiddenException(
        'No puedes gestionar usuarios de otra institución',
      );
    }

    if (esAdministradorGeneral(usuario)) {
      throw new ForbiddenException(
        'No puedes gestionar un usuario con acceso global',
      );
    }
  }

  private resolverInstitucionObjetivo(
    institucionId: number | undefined,
    currentUser: Usuario,
  ): number {
    if (esAdministradorGeneral(currentUser)) {
      if (institucionId === undefined) {
        throw new BadRequestException(
          'Debe seleccionar la institución del usuario',
        );
      }
      return institucionId;
    }

    if (
      institucionId !== undefined &&
      institucionId !== currentUser.institucion_id
    ) {
      throw new ForbiddenException(
        'Solo puedes asignar usuarios a tu propia institución',
      );
    }

    return currentUser.institucion_id;
  }
}
