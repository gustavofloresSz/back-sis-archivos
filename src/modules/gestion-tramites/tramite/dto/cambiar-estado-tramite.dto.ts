import { Type } from 'class-transformer';
import {IsBoolean,IsInt,IsOptional,IsString,Min,MinLength,} from 'class-validator';

export class CambiarEstadoTramiteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_nuevo_id: number;

  @IsString()
  @MinLength(5)
  motivo: string;

  @IsOptional()
  @IsBoolean()
  es_correccion_administrativa?: boolean;

}
