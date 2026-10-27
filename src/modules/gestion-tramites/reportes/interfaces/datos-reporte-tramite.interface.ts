export interface EstadoReporteTramite {
  fecha: string;
  estado: string;
  motivo: string;
  responsable: string;
}

export interface DatosReporteTramite {
  codigo: string;
  fechaGeneracion: string;
  fechaRegistro: string;
  gestion: string;
  numeroTramite: string;
  numeroFolder: string;
  solicitante: string;
  matricula: string;
  segmento: string;
  tipoTramite: string;
  clasificacion: string;
  estadoActual: string;
  zona: string;
  distrito: string;
  codigoCatastral: string;
  ubicacionFisica: string;
  observaciones: string;
  superficies: Array<{ nombre: string; valor: string }>;
  historial: EstadoReporteTramite[];
}
