BEGIN;

DO $$
BEGIN
  CREATE TYPE tipo_sello AS ENUM ('plano', 'resolucion');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

ALTER TABLE archivo ADD COLUMN IF NOT EXISTS tipos_sello tipo_sello[];

COMMIT;
