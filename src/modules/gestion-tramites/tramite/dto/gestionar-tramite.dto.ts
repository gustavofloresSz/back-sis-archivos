import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import type { DocumentosVerificados } from '../../workflow/historial-estado/entities/historial_estado_tramite.entity';

const transformarBooleanoFormulario = ({
  value,
}: TransformFnParams): unknown => {
  const valor: unknown = value;

  if (valor === 'true') return true;
  if (valor === 'false') return false;

  return valor;
};

const transformarJsonFormulario = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
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

  @IsOptional()
  @Transform(transformarJsonFormulario)
  @IsObject()
  documentos_verificados?: DocumentosVerificados;
}
