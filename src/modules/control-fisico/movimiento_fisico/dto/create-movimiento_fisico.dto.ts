import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoMovimientoFisico } from '../entities/movimiento_fisico.entity';

export class CreateMovimientoFisicoDto {

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tramite_id: number;

  @IsEnum(TipoMovimientoFisico)
  tipo_movimiento: TipoMovimientoFisico;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ubicacion_destino_id?: number;

  @IsOptional()
  @IsString()
  nombre_persona?: string;

  @IsOptional()
  @IsString()
  documento_persona?: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
