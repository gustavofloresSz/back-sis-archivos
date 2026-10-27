import { IsNotEmpty, IsString } from 'class-validator';

export class SintetizarTextoDto {
  @IsString()
  @IsNotEmpty()
  texto: string;
}