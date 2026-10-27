import { PartialType } from '@nestjs/mapped-types';
import { CreateUbicacionFisicaDto } from './create-ubicacion-fisica.dto';

export class UpdateUbicacionFisicaDto extends PartialType(CreateUbicacionFisicaDto) {}
