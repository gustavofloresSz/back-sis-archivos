import { Controller, Post, Body, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import { PermissionProtected, UserRequest } from '../auth/decorators';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { RecursoPermiso } from './permiso/enums/recurso-permiso.enum';


import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly userService: UsuariosService) {}

  @Post('create')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'crear' })
  create(
    @Body() createUserDto: CreateUsuarioDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.userService.createUser(createUserDto, currentUser);
  }

  @Get('getAll')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'ver' })
  findAll(@UserRequest() currentUser: Usuario) {
    return this.userService.getAllUsers(currentUser);
  }

  @Get('paginado')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'ver' })
  findPaginated(
    @Query() dto: PaginationQueryDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.userService.getPaginatedUsers(dto, currentUser);
  }

  @Get('roles-asignables/crear')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'crear' })
  findRolesAsignablesParaCrear(@UserRequest() currentUser: Usuario) {
    return this.userService.getRolesAsignables(currentUser);
  }

  @Get('roles-asignables/editar')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'editar' })
  findRolesAsignablesParaEditar(@UserRequest() currentUser: Usuario) {
    return this.userService.getRolesAsignables(currentUser);
  }

  @Patch('cambiar-password')
  cambiarPassword(
    @Body() cambiarPasswordDto: CambiarPasswordDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.userService.cambiarPassword(
      currentUser.id,
      cambiarPasswordDto,
    );
  }

  @Patch('update/:id')
  @PermissionProtected({ recurso: RecursoPermiso.USUARIO, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.userService.updateUser(id, updateUsuarioDto, currentUser);
  }

}
