import { PartialType } from '@nestjs/mapped-types';
import { CreateEstanteFisicoDto } from './create-estante-fisico.dto';

export class UpdateEstanteFisicoDto extends PartialType(CreateEstanteFisicoDto) {}
