import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoTramiteDto } from './create-estado_tramite.dto';

export class UpdateEstadoTramiteDto extends PartialType(CreateEstadoTramiteDto) {}
