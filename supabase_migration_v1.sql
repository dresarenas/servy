-- ============================================================
-- SERVY -- Migracion Supabase v1
-- Ejecutar en SQL Editor de Supabase
-- Sin datos reales: se hace DROP + recreacion limpia
-- ============================================================

-- 0. Limpiar tablas anteriores (sin datos reales, es seguro)
DROP TABLE IF EXISTS prestadores CASCADE;
DROP TABLE IF EXISTS categorias  CASCADE;

-- ============================================================
-- 1. Tabla de categorias/oficios
-- ============================================================
CREATE TABLE categorias (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL UNIQUE,
  descripcion text,
  activa      boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 2. Tabla unificada de prestadores
-- ============================================================
CREATE TABLE prestadores (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  nombre          text        NOT NULL,
  telefono        text,
  codigo_pais     text        DEFAULT '54',
  categorias      text[],
  descripcion_detallada text,

  zona_sugerida   text,

  lat             float8,
  lng             float8,
  radio_km        integer     DEFAULT 10,
  zona_confirmada boolean     DEFAULT false,

  estado          text        NOT NULL DEFAULT 'propuesto'
                              CHECK (estado IN ('propuesto','activo','inactivo','pausado')),
  pausado_hasta   date,

  origen          text        CHECK (origen IN ('recomendacion','autoregistro','ingreso_manual')),

  quien_recomienda_nombre   text,
  quien_recomienda_tel      text,
  quien_recomienda_barrio   text,
  estrellas_iniciales       smallint CHECK (estrellas_iniciales BETWEEN 1 AND 5),

  dni_numero              text,
  dni_foto_frente_url     text,
  dni_foto_dorso_url      text,
  certificado_conducta_url text,
  fotos_trabajo_urls      text[],

  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Trigger updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prestadores_updated
  BEFORE UPDATE ON prestadores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. Indices
-- ============================================================
CREATE INDEX idx_prestadores_estado     ON prestadores (estado);
CREATE INDEX idx_prestadores_categorias ON prestadores USING GIN (categorias);
CREATE INDEX idx_prestadores_geo        ON prestadores (lat, lng) WHERE lat IS NOT NULL;

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publico_lee_activos"
  ON prestadores FOR SELECT USING (estado = 'activo');

CREATE POLICY "service_inserta"
  ON prestadores FOR INSERT WITH CHECK (true);

CREATE POLICY "service_actualiza"
  ON prestadores FOR UPDATE USING (true);

CREATE POLICY "publico_lee_categorias"
  ON categorias FOR SELECT USING (activa = true);

-- ============================================================
-- 6. Verificar (descomentar y correr por separado)
-- ============================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'prestadores'
-- ORDER BY ordinal_position;
