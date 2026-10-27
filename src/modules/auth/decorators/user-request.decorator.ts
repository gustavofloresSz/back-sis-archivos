import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';
import { Usuario } from 'src/modules/usuarios/entities/usuario.entity';

export const UserRequest = createParamDecorator<ExecutionContext>(
  (data: unknown,ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: Usuario }>();
    const user = request.user;
    if (!user) throw new InternalServerErrorException('User not found in request');
    return user;
  },
);
