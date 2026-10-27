import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AplicarSelloDocumentoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  archivo_id: number;
}
