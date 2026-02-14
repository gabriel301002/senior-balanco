-- Add collaborator price column to produtos
ALTER TABLE public.produtos 
ADD COLUMN preco_colaborador numeric DEFAULT NULL;

-- Update existing cigarette product(s) with collaborator price
UPDATE public.produtos SET preco_colaborador = 15.00 WHERE LOWER(nome) LIKE '%cigarro%';