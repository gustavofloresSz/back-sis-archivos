import {
  BadRequestException,
  BadGatewayException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Repository } from 'typeorm';
import { Tramite } from '../gestion-tramites/tramite/entities/tramite.entity';

const RASA_URL_PREDETERMINADA = 'http://127.0.0.1:5005';
const SERVICIO_VOZ_URL_PREDETERMINADA = 'http://127.0.0.1:8001';
const TIEMPO_ESPERA_RASA_MS = 60_000;
const TIEMPO_ESPERA_VOZ_MS = 90_000;
const IDENTIFICADOR_USUARIO_RASA = 'usuario_prueba';

export interface RespuestaRasa {
  recipient_id?: string;
  text?: string;
  image?: string;
  buttons?: unknown[];
  custom?: unknown;
}

export interface RespuestaTranscripcion {
  texto_original: string;
  texto_normalizado: string;
  texto: string;
  codigo_detectado: string | null;
  codigo_valido: boolean;
  cantidad_bloques: number | null;
  advertencia: string | null;
  idioma: string;
  probabilidad_idioma: number;
  duracion_segundos: number;
}

export interface RespuestaMensajesAgente {
  respuestas: RespuestaRasa[];
}

export interface RespuestaEstadoTramite {
  codigo_tramite: string;
  codigo_catastral: string | null;
  nombres_apellidos: string;
  tipo_tramite: string;
  estado: string;
  estado_descripcion: string;
  es_estado_final: boolean;
  observaciones: string;
  fecha_registro: Date;
  fecha_actualizacion: Date;
}

@Injectable()
export class AgenteService {
  private readonly clienteRasa: AxiosInstance;
  private readonly clienteVoz: AxiosInstance;

  constructor(
    @InjectRepository(Tramite)
    private readonly tramiteRepository: Repository<Tramite>,
    configService: ConfigService,
  ) {
    this.clienteRasa = axios.create({
      baseURL: configService.get<string>(
        'RASA_URL',
        RASA_URL_PREDETERMINADA,
      ),
      timeout: TIEMPO_ESPERA_RASA_MS,
    });

    this.clienteVoz = axios.create({
      baseURL: configService.get<string>(
        'VOICE_SERVICE_URL',
        SERVICIO_VOZ_URL_PREDETERMINADA,
      ),
      timeout: TIEMPO_ESPERA_VOZ_MS,
    });
  }

  async enviarMensaje(mensaje: string): Promise<RespuestaMensajesAgente> {
    const respuestas = await this.ejecutarSolicitudExterna(
      () =>
        this.clienteRasa.post<RespuestaRasa[]>(
          '/webhooks/rest/webhook',
          {
            sender: IDENTIFICADOR_USUARIO_RASA,
            message: mensaje.trim(),
          },
        ),
      'No fue posible comunicarse con Rasa.',
    );

    return { respuestas };
  }

  transcribirAudio(
    audio: Express.Multer.File,
  ): Promise<RespuestaTranscripcion> {
    const formulario = this.crearFormularioAudio(audio);

    return this.ejecutarSolicitudExterna(
      () =>
        this.clienteVoz.post<RespuestaTranscripcion>(
          '/voz/transcribir',
          formulario,
        ),
      'No fue posible transcribir el audio.',
    );
  }

  async sintetizarTexto(texto: string): Promise<Buffer> {
    const audio = await this.ejecutarSolicitudExterna(
      () =>
        this.clienteVoz.post<ArrayBuffer>(
          '/voz/sintetizar',
          { texto: texto.trim() },
          { responseType: 'arraybuffer' },
        ),
      'No fue posible generar la respuesta de voz.',
    );

    return Buffer.from(audio);
  }

  async consultarEstadoPorReferencia(
    referencia: string,
  ): Promise<RespuestaEstadoTramite> {
    const referenciaNormalizada = referencia?.trim().toUpperCase();

    if (!referenciaNormalizada) {
      throw new BadRequestException(
        'Debe proporcionar un código de consulta válido.',
      );
    }

    const referenciaSinEspacios = referenciaNormalizada.replace(/\s+/g, '');
    const codigoReducido = referenciaSinEspacios.match(
      /^([A-Z][A-Z0-9]*)-(\d{4})-(\d{1,6})$/,
    );
    const codigoCompleto =
      /^[A-Z][A-Z0-9]*-[A-Z][A-Z0-9]*-\d{4}-\d{1,6}$/.test(
        referenciaSinEspacios,
      );

    const consulta = this.tramiteRepository
      .createQueryBuilder('tramite')
      .leftJoinAndSelect('tramite.tipo_tramite', 'tipo_tramite')
      .leftJoinAndSelect('tramite.estado_actual', 'estado_actual')
      .select([
        'tramite.id',
        'tramite.codigo_tramite',
        'tramite.codigo_catastral',
        'tramite.nombres_apellidos',
        'tramite.observaciones',
        'tramite.fecha_registro',
        'tramite.fecha_actualizacion',
        'tipo_tramite.id',
        'tipo_tramite.nombre',
        'estado_actual.id',
        'estado_actual.nombre',
        'estado_actual.descripcion',
        'estado_actual.es_final',
      ])
      .orderBy('tramite.id', 'DESC')
      .take(2);

    if (codigoReducido) {
      const [, segmento, gestionTexto, numeroTexto] = codigoReducido;
      const numeroTramite = Number(numeroTexto);

      if (numeroTramite < 1) {
        throw new BadRequestException(
          'El número de trámite debe ser mayor a cero.',
        );
      }

      consulta
        .where('UPPER(TRIM(tipo_tramite.segmento)) = :segmento', {
          segmento,
        })
        .andWhere('tramite.gestion = :gestion', {
          gestion: Number(gestionTexto),
        })
        .andWhere('tramite.num_tramite = :numeroTramite', {
          numeroTramite,
        });
    } else if (codigoCompleto) {
      consulta.where('UPPER(tramite.codigo_tramite) = :codigoTramite', {
        codigoTramite: referenciaSinEspacios,
      });
    } else {
      consulta.where(
        'UPPER(TRIM(tramite.codigo_catastral)) = :codigoCatastral',
        { codigoCatastral: referenciaNormalizada },
      );
    }

    const tramites = await consulta.getMany();

    if (tramites.length === 0) {
      throw new NotFoundException('No se encontró el trámite consultado.');
    }

    if (tramites.length > 1) {
      throw new ConflictException(
        'La referencia coincide con trámites de más de una institución. Use el código completo, incluyendo la sigla de la institución.',
      );
    }

    const [tramite] = tramites;

    return {
      codigo_tramite: tramite.codigo_tramite,
      codigo_catastral: tramite.codigo_catastral,
      nombres_apellidos: tramite.nombres_apellidos,
      tipo_tramite:
        tramite.tipo_tramite?.nombre ?? 'Sin tipo de trámite',
      estado: tramite.estado_actual?.nombre ?? 'Sin estado asignado',
      estado_descripcion:
        tramite.estado_actual?.descripcion ??
        'Sin descripción del estado',
      es_estado_final: tramite.estado_actual?.es_final ?? false,
      observaciones:
        tramite.observaciones || 'Sin observaciones registradas',
      fecha_registro: tramite.fecha_registro,
      fecha_actualizacion: tramite.fecha_actualizacion,
    };
  }

  private crearFormularioAudio(audio: Express.Multer.File): FormData {
    const archivo = new Blob([new Uint8Array(audio.buffer)], {
      type: audio.mimetype || 'audio/webm',
    });
    const formulario = new FormData();

    formulario.append(
      'audio',
      archivo,
      audio.originalname || 'grabacion.webm',
    );

    return formulario;
  }

  private async ejecutarSolicitudExterna<T>(
    solicitud: () => Promise<AxiosResponse<T>>,
    mensajePredeterminado: string,
  ): Promise<T> {
    try {
      const respuesta = await solicitud();
      return respuesta.data;
    } catch (error: unknown) {
      throw new BadGatewayException(
        this.obtenerMensajeError(error, mensajePredeterminado),
      );
    }
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    if (!axios.isAxiosError<unknown>(error)) {
      return mensajePredeterminado;
    }

    const mensajeRespuesta = this.extraerMensajeRespuesta(
      error.response?.data,
    );

    if (mensajeRespuesta) {
      return mensajeRespuesta;
    }

    if (error.code === 'ECONNREFUSED') {
      return (
        `${mensajePredeterminado} ` +
        'El servicio correspondiente no está iniciado.'
      );
    }

    return mensajePredeterminado;
  }

  private extraerMensajeRespuesta(datos: unknown): string | null {
    if (!this.esRegistro(datos)) {
      return null;
    }

    if (typeof datos.detail === 'string') {
      return datos.detail;
    }

    if (typeof datos.message === 'string') {
      return datos.message;
    }

    if (
      Array.isArray(datos.message) &&
      datos.message.every(
        (elemento): elemento is string => typeof elemento === 'string',
      )
    ) {
      return datos.message.join(' ');
    }

    return null;
  }

  private esRegistro(valor: unknown): valor is Record<string, unknown> {
    return (
      typeof valor === 'object' &&
      valor !== null &&
      !Array.isArray(valor)
    );
  }
}
