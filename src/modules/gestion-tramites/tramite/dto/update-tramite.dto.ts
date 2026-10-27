import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTramiteDto } from './create-tramite.dto';

export class UpdateTramiteDto extends PartialType(
  OmitType(CreateTramiteDto, [
    'gestion',
    'num_tramite',
    'estado_actual_id',
    'numero_comprobante',
    'monto_comprobante',
    'concepto_comprobante',
    'estado_inicial_id',
    'motivo_estado_inicial',
  ] as const),
) {}
