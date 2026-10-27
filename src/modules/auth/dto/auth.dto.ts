import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDto {
    
    @IsNotEmpty()
    login: string

    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    password: string
}

