import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaInterceptor } from './auditoria.interceptor';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaTask } from './auditoria.task';

@Module({
  providers: [
    AuditoriaService,
    AuditoriaTask,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
