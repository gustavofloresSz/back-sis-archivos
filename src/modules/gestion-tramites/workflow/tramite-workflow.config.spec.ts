import {
  EstadoTramiteWorkflow,
  ESTADOS_INICIALES_PERMITIDOS,
  ESTADOS_POSTERIORES_AL_REGISTRO,
  TRANSICIONES_CORRECCION_ADMINISTRATIVA,
  TRANSICIONES_TRAMITE,
} from './tramite-workflow.config';

describe('Configuración del workflow de trámites', () => {
  it('establece Archivado como único estado inicial', () => {
    expect(ESTADOS_INICIALES_PERMITIDOS).toEqual([
      EstadoTramiteWorkflow.ARCHIVADO,
    ]);
  });

  it('mantiene las transiciones definidas para los estados intermedios', () => {
    expect(TRANSICIONES_TRAMITE[EstadoTramiteWorkflow.ARCHIVADO]).toEqual([
      EstadoTramiteWorkflow.CON_OBSERVACIONES,
      EstadoTramiteWorkflow.SUSPENDIDO,
      EstadoTramiteWorkflow.CONCLUIDO,
      EstadoTramiteWorkflow.ANULADO,
    ]);

    expect(
      TRANSICIONES_TRAMITE[EstadoTramiteWorkflow.CON_OBSERVACIONES],
    ).toEqual([
      EstadoTramiteWorkflow.SUSPENDIDO,
      EstadoTramiteWorkflow.CONCLUIDO,
      EstadoTramiteWorkflow.ANULADO,
      EstadoTramiteWorkflow.ABANDONO,
    ]);

    expect(TRANSICIONES_TRAMITE[EstadoTramiteWorkflow.SUSPENDIDO]).toEqual([
      EstadoTramiteWorkflow.CON_OBSERVACIONES,
      EstadoTramiteWorkflow.CONCLUIDO,
      EstadoTramiteWorkflow.ANULADO,
      EstadoTramiteWorkflow.ABANDONO,
    ]);
  });

  it('ofrece después del registro únicamente transiciones válidas desde Archivado', () => {
    expect(ESTADOS_POSTERIORES_AL_REGISTRO).toEqual(
      TRANSICIONES_TRAMITE[EstadoTramiteWorkflow.ARCHIVADO],
    );
    expect(ESTADOS_POSTERIORES_AL_REGISTRO).not.toContain(
      EstadoTramiteWorkflow.ARCHIVADO,
    );
    expect(ESTADOS_POSTERIORES_AL_REGISTRO).not.toContain(
      EstadoTramiteWorkflow.ABANDONO,
    );
  });

  it('utiliza Archivado únicamente como estado inicial', () => {
    for (const transiciones of Object.values(TRANSICIONES_TRAMITE)) {
      expect(transiciones).not.toContain(EstadoTramiteWorkflow.ARCHIVADO);
    }
  });

  it.each([
    EstadoTramiteWorkflow.CONCLUIDO,
    EstadoTramiteWorkflow.ANULADO,
    EstadoTramiteWorkflow.ABANDONO,
  ])('no permite transiciones desde el estado final %s', (estadoFinal) => {
    expect(TRANSICIONES_TRAMITE[estadoFinal]).toEqual([]);
  });

  it('no habilita correcciones administrativas fuera del flujo definido', () => {
    for (const transiciones of Object.values(
      TRANSICIONES_CORRECCION_ADMINISTRATIVA,
    )) {
      expect(transiciones).toEqual([]);
    }
  });
});
