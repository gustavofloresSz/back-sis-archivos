import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateComprobantePagoDto {
  @IsString() 
  @IsNotEmpty() 
  numero_comprobante: string;

  @Type(() => Number) 
  @IsNumber()
  monto: number;

  @IsOptional()
  @IsString() 
  concepto: string |null ;

  @Type(() => Number) 
  @IsInt() 
  tramite_id: number;
}
