import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTipoTramiteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  segmento: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
