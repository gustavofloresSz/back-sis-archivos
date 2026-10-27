export interface ResumenEstadoWorkflow {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  es_final: boolean;
}

export interface ResumenTransicionWorkflow {
  origen: string;
  destino: string;
  cantidad: number;
}

export interface ResumenWorkflowTramites {
  alcance: {
    tipo: 'institucion' | 'global';
    institucion_id: number | null;
    institucion_nombre: string | null;
  };
  indicadores: {
    total: number;
  };
  estados: ResumenEstadoWorkflow[];
  transiciones: ResumenTransicionWorkflow[];
}
