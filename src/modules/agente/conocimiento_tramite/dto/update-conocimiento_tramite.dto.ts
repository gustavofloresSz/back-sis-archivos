import { PartialType } from '@nestjs/mapped-types';
import { CreateConocimientoTramiteDto } from './create-conocimiento_tramite.dto';

export class UpdateConocimientoTramiteDto extends PartialType(CreateConocimientoTramiteDto) {}
