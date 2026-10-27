import { Module } from '@nestjs/common';
import { ArchivoModule } from './archivo/archivo.module';
import { ComprobantePagoModule } from './comprobante-pago/comprobante_pago.module';
import { SelloDocumentoModule } from './sello-documento/sello-documento.module';

@Module({
  imports: [ArchivoModule, ComprobantePagoModule, SelloDocumentoModule],
  exports: [ArchivoModule, ComprobantePagoModule, SelloDocumentoModule],
})
export class DocumentosModule {}
