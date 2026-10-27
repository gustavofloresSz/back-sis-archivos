import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateHistorialEstadoTramiteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tramite_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuario_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_anterior_id?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_nuevo_id: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
