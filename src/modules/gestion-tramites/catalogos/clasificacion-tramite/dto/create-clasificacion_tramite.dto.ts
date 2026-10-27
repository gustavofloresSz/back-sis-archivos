import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClasificacionTramiteDto {
  @IsString() 
  @IsNotEmpty() 
  @MaxLength(150)
  nombre: string;

  @IsOptional() 
  @IsBoolean() 
  estado?: boolean;
}
