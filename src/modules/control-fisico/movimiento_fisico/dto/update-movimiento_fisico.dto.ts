import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoFisicoDto } from './create-movimiento_fisico.dto';

export class UpdateMovimientoFisicoDto extends PartialType(CreateMovimientoFisicoDto) {}
