import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institucion } from './entities/institucion.entity';
import { InstitucionController } from './institucion.controller';
import { InstitucionService } from './institucion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institucion])],
  controllers: [InstitucionController],
  providers: [InstitucionService],
  exports: [TypeOrmModule, InstitucionService],
})
export class InstitucionModule {}
