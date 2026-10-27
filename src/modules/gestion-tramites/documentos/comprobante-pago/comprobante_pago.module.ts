import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantePago } from './entities/comprobante_pago.entity';
import { ComprobantePagoController } from './comprobante_pago.controller';
import { ComprobantePagoService } from './comprobante_pago.service';
import { Tramite } from '../../tramite/entities/tramite.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ComprobantePago, Tramite])
    ],
    controllers: [ComprobantePagoController],
    providers: [ComprobantePagoService],
    exports: [TypeOrmModule, ComprobantePagoService]
})

export class ComprobantePagoModule { }
