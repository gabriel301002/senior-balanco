-- Create profiles table for user authentication
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  saldo NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (true);

-- Create movimentacoes_cliente table
CREATE TABLE public.movimentacoes_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  produto_id UUID,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimentacoes_cliente"
  ON public.movimentacoes_cliente FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_cliente"
  ON public.movimentacoes_cliente FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert produtos"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update produtos"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete produtos"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (true);

-- Create movimentacoes_estoque table
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  cliente_id UUID,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimentacoes_estoque"
  ON public.movimentacoes_estoque FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_estoque"
  ON public.movimentacoes_estoque FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create colaboradores table
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  debito NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view colaboradores"
  ON public.colaboradores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert colaboradores"
  ON public.colaboradores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update colaboradores"
  ON public.colaboradores FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete colaboradores"
  ON public.colaboradores FOR DELETE
  TO authenticated
  USING (true);

-- Create movimentacoes_colaborador table
CREATE TABLE public.movimentacoes_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('debito', 'pagamento')),
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_colaborador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimentacoes_colaborador"
  ON public.movimentacoes_colaborador FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_colaborador"
  ON public.movimentacoes_colaborador FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create mantimentos table
CREATE TABLE public.mantimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  estoque_atual NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_maximo NUMERIC(10,2),
  foto_url TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mantimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mantimentos"
  ON public.mantimentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert mantimentos"
  ON public.mantimentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update mantimentos"
  ON public.mantimentos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete mantimentos"
  ON public.mantimentos FOR DELETE
  TO authenticated
  USING (true);

-- Create movimentacoes_mantimento table
CREATE TABLE public.movimentacoes_mantimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mantimento_id UUID REFERENCES public.mantimentos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade NUMERIC(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_mantimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movimentacoes_mantimento"
  ON public.movimentacoes_mantimento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movimentacoes_mantimento"
  ON public.movimentacoes_mantimento FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for product and mantimentos images
INSERT INTO storage.buckets (id, name, public)
VALUES ('produto-fotos', 'produto-fotos', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('mantimento-fotos', 'mantimento-fotos', true);

-- Storage policies for produto-fotos
CREATE POLICY "Public read access for produto-fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produto-fotos');

CREATE POLICY "Authenticated users can upload produto-fotos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'produto-fotos');

CREATE POLICY "Authenticated users can update produto-fotos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'produto-fotos');

CREATE POLICY "Authenticated users can delete produto-fotos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'produto-fotos');

-- Storage policies for mantimento-fotos
CREATE POLICY "Public read access for mantimento-fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'mantimento-fotos');

CREATE POLICY "Authenticated users can upload mantimento-fotos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'mantimento-fotos');

CREATE POLICY "Authenticated users can update mantimento-fotos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'mantimento-fotos');

CREATE POLICY "Authenticated users can delete mantimento-fotos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'mantimento-fotos');

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mantimentos_updated_at BEFORE UPDATE ON public.mantimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation - create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();