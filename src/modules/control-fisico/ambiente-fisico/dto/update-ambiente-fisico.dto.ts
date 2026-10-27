import { PartialType } from '@nestjs/mapped-types';
import { CreateAmbienteFisicoDto } from './create-ambiente-fisico.dto';

export class UpdateAmbienteFisicoDto extends PartialType(CreateAmbienteFisicoDto) {}
