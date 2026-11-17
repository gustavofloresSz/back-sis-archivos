import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthDto } from './dto/auth.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../usuarios/entities/usuario.entity';
import { jwtPayload } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private userRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) { }

  async login({ login, password }: AuthDto) { 
    const userDB = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.institucion', 'institucion')
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('rol.permisos', 'permisos')
      .where('user.login = :login', { login })
      .getOne();

    if (!userDB) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos',);
    }
    if (!bcrypt.compareSync(password, userDB.password)) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos',);
    }
    if (!userDB.estado) {
      throw new UnauthorizedException('Usuario deshabilitado',);
    }
    return {
      token: this._generateToken(userDB),
      id: userDB.id,
      nombre: userDB.nombre_completo,
      rol: userDB.rol.nombre,
      rol_id: userDB.rol_id,
      permisos: this.obtenerPermisos(userDB),
      institucion: userDB.institucion,
    };
  }

  async checkAuthStatus(userId: number) {
    const userDB = await this.userRepository.findOne({
      where: { id: userId },
      relations: { institucion: true, rol: { permisos: true } },
    });
    if (!userDB) throw new UnauthorizedException();
    return { 
      token: this._generateToken(userDB),
      id: userDB.id,
      nombre: userDB.nombre_completo,
      rol: userDB.rol.nombre,
      rol_id: userDB.rol_id,
      permisos: this.obtenerPermisos(userDB),
      institucion: userDB.institucion,
    };
  }


  private _generateToken(user: Usuario): string {
    const payload: jwtPayload = {
      userId: user.id,
      fullname: user.nombre_completo,
    };
    return this.jwtService.sign(payload);
  }

  private obtenerPermisos(user: Usuario) {
    return (user.rol?.permisos ?? []).map((permiso) => ({
      recurso: permiso.recurso,
      accion: permiso.accion,
    }));
  }
}
