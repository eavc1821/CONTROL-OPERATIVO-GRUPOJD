ALTER TABLE ingresos_transporte
ADD COLUMN IF NOT EXISTS viaticos numeric(12,2) NOT NULL DEFAULT 3500;

UPDATE ingresos_transporte
SET viaticos = 3500
WHERE viaticos IS NULL;
