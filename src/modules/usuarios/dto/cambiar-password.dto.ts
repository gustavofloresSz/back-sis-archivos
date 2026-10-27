import { IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @MinLength(5)
  @MaxLength(72)
  password_actual: string;

  @IsString()
  @MinLength(5)
  @MaxLength(72)
  password_nueva: string;

  @IsString()
  @MinLength(5)
  @MaxLength(72)
  confirmar_password_nueva: string;
}
