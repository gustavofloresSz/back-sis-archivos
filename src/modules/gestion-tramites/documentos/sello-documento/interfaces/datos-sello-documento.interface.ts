export interface DatosSelloDocumento {
  tipoPlano: string;
  resolucionMunicipal: string;
  fechaResolucion: string;
  zona: string;
  distrito: string;
  urbanizacion?: { manzano: string; lote: string; superficie: string };
  fechaEmision: string;
}
