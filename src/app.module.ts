import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { TareasModule } from './modules/tareas/tareas.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RolModule } from './modules/usuarios/rol/rol.module';
import { PermisoModule } from './modules/usuarios/permiso/permiso.module';
import { GestionTramitesModule } from './modules/gestion-tramites/gestion-tramites.module';
import { OrganizacionModule } from './modules/organizacion/organizacion.module';
import { ControlFisicoModule } from './modules/control-fisico/control-fisico.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    TareasModule, // para las tareas
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,

    }),
    AuthModule,
    UsuariosModule,
    RolModule,
    PermisoModule,
    GestionTramitesModule,
    OrganizacionModule,
    ControlFisicoModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
