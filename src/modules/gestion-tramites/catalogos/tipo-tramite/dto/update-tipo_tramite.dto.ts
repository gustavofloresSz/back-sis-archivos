import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTipoTramiteDto } from './create-tipo_tramite.dto';

export class UpdateTipoTramiteDto extends PartialType(
  OmitType(CreateTipoTramiteDto, ['segmento'] as const),
) {}
