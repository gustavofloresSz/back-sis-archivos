import { constants } from 'node:fs';
import { access, mkdir, stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

export function obtenerDirectorioUploads(): string {
  const configurado = process.env.UPLOADS_DIR?.trim();
  if (!configurado) return resolve(process.cwd(), 'uploads');

  if (!isAbsolute(configurado)) {
    throw new Error('UPLOADS_DIR debe ser una ruta absoluta del sistema de archivos.');
  }
  return resolve(configurado);
}

export async function prepararDirectorioUploads(): Promise<string> {
  const directorio = obtenerDirectorioUploads();
  try {
    if (!process.env.UPLOADS_DIR?.trim()) {
      await mkdir(directorio, { recursive: true });
    }
    if (!(await stat(directorio)).isDirectory()) {
      throw new Error('La ruta no es una carpeta.');
    }
    await access(directorio, constants.R_OK | constants.W_OK | constants.X_OK);
  } catch (cause) {
    throw new Error(`El almacenamiento de archivos no está disponible: ${directorio}`, { cause });
  }
  return directorio;
}
