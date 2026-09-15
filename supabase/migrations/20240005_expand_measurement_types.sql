-- Migration 005: expand_measurement_types
-- Applied to: yogzsyrwboyvsomgnavd
-- Apply via: Supabase MCP or supabase db push

-- Drop the old constraint
ALTER TABLE public.health_measurements DROP CONSTRAINT IF EXISTS health_measurements_measurement_type_check;

-- Add the new constraint with expanded types
ALTER TABLE public.health_measurements ADD CONSTRAINT health_measurements_measurement_type_check 
CHECK (measurement_type IN ('heart_rate','spo2','respiratory_rate','hrv','estimated_hemoglobin','anemia_screening','sclera_screening','lab_biomarker'));
