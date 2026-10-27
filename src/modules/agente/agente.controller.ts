import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators';
import { AgenteService } from './agente.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { SintetizarTextoDto } from './dto/sintetizar-texto.dto';

const TAMANO_MAXIMO_AUDIO = 15 * 1024 * 1024;
const TIPOS_AUDIO_PERMITIDOS =
  /^(audio\/(webm|wav|x-wav|mpeg|mp4|ogg)|video\/webm)$/;

@Controller('agente')
export class AgenteController {
  constructor(private readonly agenteService: AgenteService) {}

  @Public()
  @Post('mensaje')
  enviarMensaje(@Body() body: EnviarMensajeDto) {
    return this.agenteService.enviarMensaje(body.mensaje);
  }

  @Public()
  @Post('transcribir')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: TAMANO_MAXIMO_AUDIO,
      },
    }),
  )
  transcribirAudio(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: TIPOS_AUDIO_PERMITIDOS,
          skipMagicNumbersValidation: true,
          errorMessage: ({ file }) =>
            `Formato de audio no permitido: ${file?.mimetype ?? 'desconocido'}`,
        })
        .addMaxSizeValidator({
          maxSize: TAMANO_MAXIMO_AUDIO,
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
          fileIsRequired: true,
          exceptionFactory: (mensaje) =>
            new BadRequestException(
              mensaje === 'File is required'
                ? 'Debe enviar un archivo de audio.'
                : mensaje,
            ),
        }),
    )
    audio: Express.Multer.File,
  ) {
    return this.agenteService.transcribirAudio(audio);
  }

  @Public()
  @Post('sintetizar')
  async sintetizarTexto(
    @Body() body: SintetizarTextoDto,
  ): Promise<StreamableFile> {
    const audio = await this.agenteService.sintetizarTexto(body.texto);

    return new StreamableFile(audio, {
      type: 'audio/wav',
      disposition: 'inline; filename="respuesta-agente.wav"',
      length: audio.length,
    });
  }

  @Public()
  @Get('estado-tramite/:referencia')
  consultarEstadoTramite(
    @Param('referencia') referencia: string,
  ) {
    return this.agenteService.consultarEstadoPorReferencia(
      referencia,
    );
  }
}
