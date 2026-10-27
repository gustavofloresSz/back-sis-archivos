import { Type } from "class-transformer";
import { IsInt, Min, IsString, MaxLength, IsOptional, IsBoolean } from "class-validator";

export class CreateEstanteFisicoDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    ambiente_fisico_id: number;

    @IsString()
    @MaxLength(30)
    codigo: string;

    @IsOptional()
    @IsBoolean()
    estado?: boolean;
}
