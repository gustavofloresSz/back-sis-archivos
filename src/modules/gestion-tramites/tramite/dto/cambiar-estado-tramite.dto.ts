import { Type } from 'class-transformer';
import {IsBoolean,IsInt,IsObject,IsOptional,IsString,Min,MinLength,} from 'class-validator';
import type { DocumentosVerificados } from '../../workflow/historial-estado/entities/historial_estado_tramite.entity';

export class CambiarEstadoTramiteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_nuevo_id: number;

  @IsString()
  @MinLength(5)
  motivo: string;

  @IsOptional()
  @IsBoolean()
  es_correccion_administrativa?: boolean;

  @IsOptional()
  @IsObject()
  documentos_verificados?: DocumentosVerificados;
}
