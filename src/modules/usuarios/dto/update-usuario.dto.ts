import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmpty,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsEmpty({ message: 'La institución del usuario no se puede modificar' })
  institucion_id?: number;

  @IsOptional()
  @IsString()
  nombre_completo?: string;

  @IsOptional()
  @IsString()
  login?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  rol_id?: number;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
