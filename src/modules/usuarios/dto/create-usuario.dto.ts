import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUsuarioDto {
    @IsString()
    @IsNotEmpty()
    nombre_completo: string;

    @IsString()
    @IsNotEmpty()
    login: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    rol_id: number;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    institucion_id?: number;

    @IsOptional()
    @IsBoolean()
    estado?: boolean;
}
