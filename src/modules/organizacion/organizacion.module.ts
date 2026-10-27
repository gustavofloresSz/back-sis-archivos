import { Module } from '@nestjs/common';
import { InstitucionModule } from './institucion/institucion.module';

@Module({
  imports: [InstitucionModule],
  exports: [InstitucionModule],
})
export class OrganizacionModule {}
