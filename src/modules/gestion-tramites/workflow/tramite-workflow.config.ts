export enum EstadoTramiteWorkflow {
  ARCHIVADO = 'Archivado',
  CON_OBSERVACIONES = 'Con observaciones',
  SUSPENDIDO = 'Suspendido',
  CONCLUIDO = 'Concluido',
  ANULADO = 'Anulado',
  ABANDONO = 'Abandono',
}

type ConfiguracionTransiciones = Readonly<
  Record<EstadoTramiteWorkflow, readonly EstadoTramiteWorkflow[]>
>;

export const ESTADOS_INICIALES_PERMITIDOS: readonly EstadoTramiteWorkflow[] = [
  EstadoTramiteWorkflow.ARCHIVADO,
];

export const TRANSICIONES_TRAMITE: ConfiguracionTransiciones = {
  [EstadoTramiteWorkflow.ARCHIVADO]: [
    EstadoTramiteWorkflow.CON_OBSERVACIONES,
    EstadoTramiteWorkflow.SUSPENDIDO,
    EstadoTramiteWorkflow.CONCLUIDO,
    EstadoTramiteWorkflow.ANULADO,
  ],
  [EstadoTramiteWorkflow.CON_OBSERVACIONES]: [
    EstadoTramiteWorkflow.SUSPENDIDO,
    EstadoTramiteWorkflow.CONCLUIDO,
    EstadoTramiteWorkflow.ANULADO,
    EstadoTramiteWorkflow.ABANDONO,
  ],
  [EstadoTramiteWorkflow.SUSPENDIDO]: [
    EstadoTramiteWorkflow.CON_OBSERVACIONES,
    EstadoTramiteWorkflow.CONCLUIDO,
    EstadoTramiteWorkflow.ANULADO,
    EstadoTramiteWorkflow.ABANDONO,
  ],
  [EstadoTramiteWorkflow.CONCLUIDO]: [],
  [EstadoTramiteWorkflow.ANULADO]: [],
  [EstadoTramiteWorkflow.ABANDONO]: [],
};

export const ESTADOS_POSTERIORES_AL_REGISTRO: readonly EstadoTramiteWorkflow[] =
  TRANSICIONES_TRAMITE[EstadoTramiteWorkflow.ARCHIVADO];

export const TRANSICIONES_CORRECCION_ADMINISTRATIVA: ConfiguracionTransiciones =
  {
    [EstadoTramiteWorkflow.ARCHIVADO]: [],
    [EstadoTramiteWorkflow.CON_OBSERVACIONES]: [],
    [EstadoTramiteWorkflow.SUSPENDIDO]: [],
    [EstadoTramiteWorkflow.CONCLUIDO]: [],
    [EstadoTramiteWorkflow.ANULADO]: [],
    [EstadoTramiteWorkflow.ABANDONO]: [],
  };
