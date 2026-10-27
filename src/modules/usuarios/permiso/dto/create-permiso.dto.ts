import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { RecursoPermiso } from '../enums/recurso-permiso.enum';

export class CreatePermisoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rol_id: number;

  @IsEnum(RecursoPermiso)
  recurso: RecursoPermiso;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'La acción debe usar letras minúsculas, números o guion bajo',
  })
  accion: string;
}
