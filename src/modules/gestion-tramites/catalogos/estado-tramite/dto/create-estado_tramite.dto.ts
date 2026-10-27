import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEstadoTramiteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  es_final?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
