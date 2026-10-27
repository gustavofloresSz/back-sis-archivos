import { Controller, Get, Post, Body } from '@nestjs/common';

import { Public, UserRequest } from './decorators';
import { AuthService } from './auth.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()//hace publica la ruta, sin tener que verificarla
  @Post('login')
  login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto);
  }

  @Get('checkStatus')
  checkAuth(@UserRequest() user: Usuario) {
    return this.authService.checkAuthStatus(user.id);
  }

  @Get('verificar-token')
  verificarToken(){
    return 'token valido';
  }
}
