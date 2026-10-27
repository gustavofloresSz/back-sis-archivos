import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RecursoPermiso } from '../../permiso/enums/recurso-permiso.enum';

export class PermisoRolDto {
  @IsEnum(RecursoPermiso)
  recurso: RecursoPermiso;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accion: string;
}

export class CreateRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermisoRolDto)
  permisos: PermisoRolDto[];
}
