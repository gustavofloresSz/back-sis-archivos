import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTramiteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  num_tramite: number;

  @Type(() => Number)
  @IsInt()
  gestion: number;

  @IsString()
  @IsNotEmpty()
  nombres_apellidos: string;

  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  zona?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manzano?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lote?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim() ? Number(value) : null;
  })
  @IsNumber()
  @Min(0)
  superficie?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sup_avance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sup_aprobada?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sup_construida?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sup_afectada?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sup_area_verde?: number;

  @IsOptional()
  @IsString()
  codigo_catastral?: string;

  @IsOptional()
  @IsString()
  resolucion_municipal?: string;

  @IsOptional()
  @IsDateString()
  fecha_resolucion?: string;

  @IsOptional()
  @IsString()
  resolucion_complementaria_aclaratoria?: string;

  @IsOptional()
  @IsString()
  fecha_resolucion_complementaria_aclaratoria?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipo_tramite_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  clasificacion_tramite_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ubicacion_fisica_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_actual_id?: number;

  //campos para el registro de comprobante
  //son campos temporales, no se registra en la tabla tramite
  @IsOptional()
  @IsString()
  numero_comprobante?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monto_comprobante?: number;

  @IsOptional()
  @IsString()
  concepto_comprobante?: string;

  //para el workflow
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_inicial_id?: number;

  @IsOptional()
  @IsString()
  motivo_estado_inicial?: string;
}
