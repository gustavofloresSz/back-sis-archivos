BEGIN;

ALTER TABLE archivo ADD COLUMN IF NOT EXISTS codigo uuid;

CREATE INDEX IF NOT EXISTS "IDX_archivo_codigo" ON archivo (codigo);
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_archivo_codigo_original"
  ON archivo (codigo) WHERE NOT es_sellado;

-- Las copias legalizadas anteriores no guardan un vínculo con el original.
-- No se les asigna un código independiente ni se reescriben sus PDF.
UPDATE archivo
SET codigo = gen_random_uuid()
WHERE NOT es_sellado AND codigo IS NULL;

COMMIT;
