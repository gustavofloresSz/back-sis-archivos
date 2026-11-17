import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { prepararDirectorioUploads } from './modules/gestion-tramites/documentos/archivo/config/archivo-almacenamiento';

async function bootstrap() {
  await prepararDirectorioUploads();
  const app = await NestFactory.create(AppModule);
  app.enableCors();//hace que sea seguro el ingreso

  app.setGlobalPrefix('api'); //para que todas las rutas tengan el prefijo api, ejemplo: http://localhost:3000/api/usuarios

  //esta config de useglobalpipes es para validar lo que envia el cliente, segun los dto
  app.useGlobalPipes(
    new ValidationPipe({ 
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
