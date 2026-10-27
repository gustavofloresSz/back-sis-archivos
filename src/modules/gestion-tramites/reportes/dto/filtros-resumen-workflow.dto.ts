import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class FiltrosResumenWorkflowDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha desde no tiene un formato válido' })
  fecha_desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha hasta no tiene un formato válido' })
  fecha_hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipo_tramite_id?: number;
}
