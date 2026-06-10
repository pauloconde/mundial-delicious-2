-- supabase/migrations/20260609140000_create_entrenadores_table.sql
-- Migration to set up World Cup coaches table

CREATE TABLE IF NOT EXISTS public.entrenadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id VARCHAR(10) REFERENCES public.equipos(codigo_fifa) ON UPDATE CASCADE ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(100),
    nacionalidad VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.entrenadores ENABLE ROW LEVEL SECURITY;

-- Enable SELECT for everyone
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read of entrenadores') THEN
        CREATE POLICY "Allow public read of entrenadores" ON public.entrenadores FOR SELECT USING (true);
    END IF;
END $$;

-- Enable all operations for authenticated users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated manage of entrenadores') THEN
        CREATE POLICY "Allow authenticated manage of entrenadores" ON public.entrenadores FOR ALL TO authenticated USING (true);
    END IF;
END $$;
