import { Type } from "class-transformer";
import { IsInt, Min, IsString, MaxLength, IsOptional, IsBoolean } from "class-validator";

export class CreateAmbienteFisicoDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  institucion_id?: number;

  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
