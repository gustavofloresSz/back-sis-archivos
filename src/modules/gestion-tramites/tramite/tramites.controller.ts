import {Body,Controller,Delete,Get,Param,ParseIntPipe,Patch,Post,Query,UploadedFiles,UseInterceptors,} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { PermissionProtected, UserRequest } from '../../auth/decorators';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RecursoPermiso } from '../../usuarios/permiso/enums/recurso-permiso.enum';
import { UploadedFileType } from '../documentos/archivo/archivo.service';
import {
  CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE,
  filtrarArchivoTramite,
} from '../documentos/archivo/config/archivo-upload.config';
import { CambiarEstadoTramiteDto } from './dto/cambiar-estado-tramite.dto';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import { GestionarTramiteDto } from './dto/gestionar-tramite.dto';
import { PaginationTramitesDto } from './dto/pagination-tramites.dto';
import { UpdateTramiteDto } from './dto/update-tramite.dto';
import { TramitesService } from './tramites.service';

const crearInterceptorArchivosTramite = () =>
  FilesInterceptor('files', CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE, {
    fileFilter: filtrarArchivoTramite,
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const uploadsDir = resolve(process.cwd(), 'uploads');

        mkdir(uploadsDir, { recursive: true })
          .then(() => callback(null, uploadsDir))
          .catch((error: Error) => callback(error, uploadsDir));
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname)
          .toLowerCase()
          .replace(/[^.a-z0-9]/g, '')
          .slice(0, 12);
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
  });

@Controller('tramites')
export class TramitesController {
  constructor(private readonly tramitesService: TramitesService) {}

  @Post('create')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'crear' })
  @UseInterceptors(crearInterceptorArchivosTramite())
  create(
    @Body() createTramiteDto: CreateTramiteDto,
    @UploadedFiles() files: UploadedFileType[],
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.create(createTramiteDto, currentUser, files);
  }

  @Patch('update/:id')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'editar' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTramiteDto: UpdateTramiteDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.update(id, updateTramiteDto, currentUser);
  }

  @Post(':id/archivos')
  @PermissionProtected({ recurso: RecursoPermiso.ARCHIVO, accion: 'agregar' })
  @UseInterceptors(crearInterceptorArchivosTramite())
  agregarArchivos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: UploadedFileType[],
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.agregarArchivos(id, currentUser, files);
  }

  @Get('workflow/estados-iniciales')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findEstadosInicialesPermitidos() {
    return this.tramitesService.findEstadosInicialesPermitidos();
  }

  @Get(':id/historial-estados')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findHistorialEstadosByTramite(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.findHistorialEstadosByTramite(
      id,
      currentUser,
    );
  }

  @Get(':id/estados-permitidos')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findEstadosPermitidos(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.findEstadosPermitidos(id, currentUser);
  }

  @Patch(':id/cambiar-estado')
  @PermissionProtected({
    recurso: RecursoPermiso.TRAMITE,
    accion: 'cambiar_estado',
  })
  cambiarEstadoTramite(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoTramiteDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.cambiarEstadoTramite(id, dto, currentUser);
  }

  @Get()
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findAll(
    @Query() paginationDto: PaginationTramitesDto,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.findAll(paginationDto, currentUser);
  }

  @Get(':id')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'ver' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.findOne(id, currentUser);
  }

  @Delete(':id')
  @PermissionProtected({ recurso: RecursoPermiso.TRAMITE, accion: 'eliminar' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.remove(id, currentUser);
  }

  @Patch(':id/gestionar')
  @PermissionProtected({
    recurso: RecursoPermiso.TRAMITE,
    accion: 'cambiar_estado',
  })
  @UseInterceptors(crearInterceptorArchivosTramite())
  gestionarTramite(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GestionarTramiteDto,
    @UploadedFiles() files: UploadedFileType[],
    @UserRequest() currentUser: Usuario,
  ) {
    return this.tramitesService.gestionarTramite(id, dto, currentUser, files);
  }
}
