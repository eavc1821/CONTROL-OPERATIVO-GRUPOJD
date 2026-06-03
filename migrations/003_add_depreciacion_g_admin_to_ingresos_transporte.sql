ALTER TABLE ingresos_transporte
ADD COLUMN IF NOT EXISTS depreciacion numeric(12,2) NOT NULL DEFAULT 2500,
ADD COLUMN IF NOT EXISTS g_admin numeric(12,2) NOT NULL DEFAULT 1680;

UPDATE ingresos_transporte
SET depreciacion = 2500
WHERE depreciacion IS NULL;

UPDATE ingresos_transporte
SET g_admin = 1680
WHERE g_admin IS NULL;
