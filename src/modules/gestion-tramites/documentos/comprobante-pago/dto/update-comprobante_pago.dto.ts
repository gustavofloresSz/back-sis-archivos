import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateComprobantePagoDto } from './create-comprobante_pago.dto';

export class UpdateComprobantePagoDto extends PartialType(
  OmitType(CreateComprobantePagoDto, ['tramite_id'] as const),
) {}
