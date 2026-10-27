import { IsNotEmpty, IsString } from 'class-validator';

export class EnviarMensajeDto {
  @IsString()
  @IsNotEmpty()
  mensaje: string;
}