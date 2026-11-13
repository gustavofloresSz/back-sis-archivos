import type { Response } from 'express';
import type { ArchivoService } from './archivo.service';

export function enviarArchivo(
  respuesta: Response,
  archivo: Awaited<ReturnType<ArchivoService['prepararEntrega']>>,
  descargar = false,
) {
  if (archivo.pdf) {
    if (descargar) respuesta.attachment(archivo.nombre);
    return respuesta.type('pdf').send(archivo.pdf);
  }
  return descargar ? respuesta.download(archivo.ruta, archivo.nombre) : respuesta.sendFile(archivo.ruta);
}
