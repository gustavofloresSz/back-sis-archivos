import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInstitucionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  sigla: string;
}
