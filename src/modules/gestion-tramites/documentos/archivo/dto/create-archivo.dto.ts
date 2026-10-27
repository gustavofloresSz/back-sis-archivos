import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateArchivoDto {
  @IsString() 
  @IsNotEmpty() 
  nombre: string;

  @IsString() 
  @IsNotEmpty() 
  nombre_original: string;

  @IsString() 
  @IsNotEmpty() 
  ruta: string;
  
  @Type(() => Number) 
  @IsInt() 
  @Min(1) 
  tramite_id: number;
}
