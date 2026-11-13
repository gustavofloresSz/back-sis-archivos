import { Type } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsInt, Min } from 'class-validator';
import { TipoSello } from '../../archivo/enums/tipo-sello.enum';

export class AplicarSelloDocumentoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  archivo_id: number;

  @IsArray({ message: 'Selecciona los tipos de sello.' })
  @ArrayNotEmpty({ message: 'Selecciona al menos un sello.' })
  @ArrayUnique({ message: 'Cada tipo de sello se puede seleccionar una sola vez.' })
  @IsEnum(TipoSello, { each: true, message: 'El tipo de sello seleccionado no es válido.' })
  tipos_sello: TipoSello[];
}
