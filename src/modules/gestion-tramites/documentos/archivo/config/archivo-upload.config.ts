import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { extname } from 'node:path';

export const CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE = 30;

const MIME_POR_EXTENSION: Record<string, readonly string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

export const filtrarArchivoTramite = (
  _request: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, aceptar: boolean) => void,
): void => {
  const extension = extname(file.originalname).toLowerCase();
  const tiposMimePermitidos = MIME_POR_EXTENSION[extension];

  if (!tiposMimePermitidos?.includes(file.mimetype.toLowerCase())) {
    callback(
      new BadRequestException(
        'Formato no permitido. Use PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, XLS o XLSX.',
      ),
      false,
    );
    return;
  }

  callback(null, true);
};
