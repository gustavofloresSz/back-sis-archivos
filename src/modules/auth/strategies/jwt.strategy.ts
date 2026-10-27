import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtPayload } from '../interfaces/jwt.interface';
import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario) private userRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt_key'),
    });
  }
  async validate(payload: jwtPayload) {
    const { userId } = payload;
    const userDB = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['institucion', 'rol', 'rol.permisos'],
    });
    if (!userDB) throw new UnauthorizedException('Token invalido, vuelva a iniciar sesion');
    if (!userDB.estado) {
      throw new UnauthorizedException('Usuario deshabilitado');
    }
    return userDB;
  }
}
