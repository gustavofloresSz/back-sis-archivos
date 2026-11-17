import { Injectable, Logger } from '@nestjs/common';
import { Archivo } from '../gestion-tramites/documentos/archivo/entities/archivo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { ArchivoEstado } from '../gestion-tramites/documentos/archivo/enums/archivo-estado.enum';
import { Cron } from '@nestjs/schedule';
import { unlink } from 'fs/promises';
import { ArchivoService } from '../gestion-tramites/documentos/archivo/archivo.service';
import { prepararDirectorioUploads } from '../gestion-tramites/documentos/archivo/config/archivo-almacenamiento';


@Injectable()
export class ArchivoCleanupService  {

    private readonly logger = new Logger(ArchivoCleanupService.name);
    constructor(
        @InjectRepository(Archivo)
        private readonly archivoRepository: Repository<Archivo>,
        private readonly archivoService: ArchivoService,
    ) {}

    // Elimina archivos pendientes o huérfanos con más de un día de antigüedad.
    @Cron('0 2 * * *')
    async limpiarArchivosNoAsociados() {
        await prepararDirectorioUploads();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 1);

        const archivos = await this.archivoRepository.find({
        where: {
            estado: In([
            ArchivoEstado.PENDIENTE,
            ArchivoEstado.HUERFANO,
            ]),
            fecha_registro: LessThan(fechaLimite),
        },
        });

        for (const archivo of archivos) {
        try {
            const rutaFisica = this.archivoService.resolverRutaFisica(archivo);
            await unlink(rutaFisica);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                this.logger.warn(`No se pudo eliminar el archivo físico: ${archivo.ruta}`);
                continue;
            }
        }

        await this.archivoRepository.remove(archivo);
        }
    }
}
