
-- Add DELETE policies on movimentações tables
CREATE POLICY "Authenticated users can delete movimentacoes_cliente"
ON public.movimentacoes_cliente
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete movimentacoes_estoque"
ON public.movimentacoes_estoque
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete movimentacoes_colaborador"
ON public.movimentacoes_colaborador
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete movimentacoes_mantimento"
ON public.movimentacoes_mantimento
FOR DELETE
TO authenticated
USING (true);

-- Add CASCADE to FKs for proper deletion
ALTER TABLE public.movimentacoes_cliente
DROP CONSTRAINT IF EXISTS movimentacoes_cliente_cliente_id_fkey,
ADD CONSTRAINT movimentacoes_cliente_cliente_id_fkey
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

ALTER TABLE public.movimentacoes_estoque
DROP CONSTRAINT IF EXISTS movimentacoes_estoque_produto_id_fkey,
ADD CONSTRAINT movimentacoes_estoque_produto_id_fkey
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;

ALTER TABLE public.movimentacoes_colaborador
DROP CONSTRAINT IF EXISTS movimentacoes_colaborador_colaborador_id_fkey,
ADD CONSTRAINT movimentacoes_colaborador_colaborador_id_fkey
FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id) ON DELETE CASCADE;

ALTER TABLE public.movimentacoes_mantimento
DROP CONSTRAINT IF EXISTS movimentacoes_mantimento_mantimento_id_fkey,
ADD CONSTRAINT movimentacoes_mantimento_mantimento_id_fkey
FOREIGN KEY (mantimento_id) REFERENCES public.mantimentos(id) ON DELETE CASCADE;
