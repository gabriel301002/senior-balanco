import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Produto, MovimentacaoEstoque } from '@/types/cantina';

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProdutos = useCallback(async () => {
    const { data: produtosData } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');

    const { data: movsData } = await supabase
      .from('movimentacoes_estoque')
      .select('*')
      .order('data', { ascending: true });

    if (produtosData) {
      const mapped: Produto[] = produtosData.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        preco: Number(p.preco),
        estoqueAtual: Number(p.estoque_atual),
        estoqueMinimo: Number(p.estoque_minimo),
        fotoUrl: p.foto_url || undefined,
        dataCadastro: new Date(p.data_cadastro),
        historico: (movsData || [])
          .filter(m => m.produto_id === p.id)
          .map(m => ({
            id: m.id,
            tipo: m.tipo as 'entrada' | 'saida',
            quantidade: Number(m.quantidade),
            descricao: m.descricao,
            data: new Date(m.data),
            clienteId: m.cliente_id || undefined,
          })),
      }));
      setProdutos(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const adicionarProduto = async (
    codigo: string,
    nome: string,
    preco: number,
    estoqueInicial: number,
    estoqueMinimo: number,
    fotoUrl?: string
  ) => {
    const { data: novoProduto, error } = await supabase
      .from('produtos')
      .insert({
        codigo,
        nome,
        preco,
        estoque_atual: estoqueInicial,
        estoque_minimo: estoqueMinimo,
        foto_url: fotoUrl || null,
      })
      .select()
      .single();

    if (!error && novoProduto && estoqueInicial > 0) {
      await supabase.from('movimentacoes_estoque').insert({
        produto_id: novoProduto.id,
        tipo: 'entrada',
        quantidade: estoqueInicial,
        descricao: 'Estoque inicial',
      });
    }

    await fetchProdutos();
  };

  const entradaEstoque = async (produtoId: string, quantidade: number, descricao: string) => {
    await supabase.from('movimentacoes_estoque').insert({
      produto_id: produtoId,
      tipo: 'entrada',
      quantidade,
      descricao,
    });

    // Recalculate estoque
    const { data: movs } = await supabase
      .from('movimentacoes_estoque')
      .select('tipo, quantidade')
      .eq('produto_id', produtoId);

    const novoEstoque = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'entrada' ? Number(m.quantidade) : -Number(m.quantidade));
    }, 0);

    await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produtoId);
    await fetchProdutos();
  };

  const saidaEstoque = async (produtoId: string, quantidade: number, descricao: string, clienteId?: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || produto.estoqueAtual < quantidade) return;

    await supabase.from('movimentacoes_estoque').insert({
      produto_id: produtoId,
      tipo: 'saida',
      quantidade,
      descricao,
      cliente_id: clienteId || null,
    });

    const { data: movs } = await supabase
      .from('movimentacoes_estoque')
      .select('tipo, quantidade')
      .eq('produto_id', produtoId);

    const novoEstoque = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'entrada' ? Number(m.quantidade) : -Number(m.quantidade));
    }, 0);

    await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produtoId);
    await fetchProdutos();
  };

  const removerProduto = async (produtoId: string) => {
    await supabase.from('produtos').delete().eq('id', produtoId);
    await fetchProdutos();
  };

  const atualizarFotoProduto = async (produtoId: string, fotoUrl: string) => {
    await supabase.from('produtos').update({ foto_url: fotoUrl }).eq('id', produtoId);
    await fetchProdutos();
  };

  return {
    produtos,
    loading,
    adicionarProduto,
    entradaEstoque,
    saidaEstoque,
    removerProduto,
    atualizarFotoProduto,
    fetchProdutos,
  };
};
