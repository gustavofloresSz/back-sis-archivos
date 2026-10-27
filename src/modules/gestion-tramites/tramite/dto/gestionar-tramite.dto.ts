import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const transformarBooleanoFormulario = ({
  value,
}: TransformFnParams): unknown => {
  const valor: unknown = value;

  if (valor === 'true') return true;
  if (valor === 'false') return false;

  return valor;
};

export class GestionarTramiteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_nuevo_id: number;

  @IsString()
  @MinLength(5)
  motivo: string;

  @IsOptional()
  @Transform(transformarBooleanoFormulario)
  @IsBoolean()
  es_correccion_administrativa?: boolean;

}
