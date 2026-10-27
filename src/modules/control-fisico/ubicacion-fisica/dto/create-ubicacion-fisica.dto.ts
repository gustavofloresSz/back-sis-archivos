import { Type } from "class-transformer";
import { IsInt, Min, IsString, MaxLength, IsOptional, IsBoolean } from "class-validator";

export class CreateUbicacionFisicaDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    estante_fisico_id: number;

    @IsString()
    @MaxLength(20)
    columna: string;

    @IsString()
    @MaxLength(20)
    fila: string;

    @IsOptional()
    @IsBoolean()
    estado?: boolean;
}
