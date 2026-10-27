import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditoriaService } from './auditoria.service';

@Injectable()
export class AuditoriaTask {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Cron('0 0 1 * * *', {
    name: 'cierre-auditoria-diaria',
    timeZone: 'America/La_Paz',
    waitForCompletion: true,
  })
  cerrarArchivoDiario(): Promise<void> {
    return this.auditoriaService.cerrarPeriodoAnterior();
  }

  @Cron('0 1 1 * * *', {
    name: 'creacion-auditoria-diaria',
    timeZone: 'America/La_Paz',
    waitForCompletion: true,
  })
  crearArchivoDiario(): Promise<void> {
    return this.auditoriaService.prepararPeriodoActual();
  }
}
