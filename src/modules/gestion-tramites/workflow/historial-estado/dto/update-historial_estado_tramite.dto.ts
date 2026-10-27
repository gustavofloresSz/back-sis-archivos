import { PartialType } from '@nestjs/mapped-types';
import { CreateHistorialEstadoTramiteDto } from './create-historial_estado_tramite.dto';

export class UpdateHistorialEstadoTramiteDto extends PartialType(CreateHistorialEstadoTramiteDto) {}
