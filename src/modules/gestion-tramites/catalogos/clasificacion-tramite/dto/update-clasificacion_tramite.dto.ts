import { PartialType } from '@nestjs/mapped-types';
import { CreateClasificacionTramiteDto } from './create-clasificacion_tramite.dto';

export class UpdateClasificacionTramiteDto extends PartialType(CreateClasificacionTramiteDto) {}
