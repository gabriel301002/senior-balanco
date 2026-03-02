
-- Add status column to existing colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';

-- Create lancamentos_colaborador table for attendance control
CREATE TABLE public.lancamentos_colaborador (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'falta_justificada', 'falta_nao_justificada', 'folga', 'plantao_extra'
  data date NOT NULL,
  atestado boolean DEFAULT false,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lancamentos_colaborador ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view lancamentos_colaborador"
ON public.lancamentos_colaborador FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lancamentos_colaborador"
ON public.lancamentos_colaborador FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update lancamentos_colaborador"
ON public.lancamentos_colaborador FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete lancamentos_colaborador"
ON public.lancamentos_colaborador FOR DELETE TO authenticated USING (true);
