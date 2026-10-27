import { IsString, IsNotEmpty, MaxLength, IsBoolean } from "class-validator";

export class CreateConocimientoTramiteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    codigo: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    requisitos: string;

    @IsBoolean()
    estado: boolean;
}
