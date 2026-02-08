import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mantimento, MovimentacaoMantimento } from '@/contexts/EstoqueMantimentosContext';

export const useSupabaseMantimentos = () => {
  const [mantimentos, setMantimentos] = useState<Mantimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMantimentos = useCallback(async () => {
    const { data: mantData } = await supabase
      .from('mantimentos')
      .select('*')
      .order('nome');

    const { data: movsData } = await supabase
      .from('movimentacoes_mantimento')
      .select('*')
      .order('data', { ascending: true });

    if (mantData) {
      const mapped: Mantimento[] = mantData.map(m => ({
        id: m.id,
        codigo: m.codigo,
        nome: m.nome,
        foto: m.foto_url || undefined,
        estoqueAtual: Number(m.estoque_atual),
        estoqueMinimo: Number(m.estoque_minimo),
        estoqueMaximo: Number(m.estoque_maximo || 0),
        unidade: m.unidade,
        dataCadastro: new Date(m.data_cadastro),
        historico: (movsData || [])
          .filter(mov => mov.mantimento_id === m.id)
          .map(mov => ({
            id: mov.id,
            tipo: mov.tipo as 'entrada' | 'saida' | 'ajuste',
            quantidade: Number(mov.quantidade),
            descricao: mov.descricao,
            data: new Date(mov.data),
          })),
      }));
      setMantimentos(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMantimentos();
  }, [fetchMantimentos]);

  const adicionarMantimento = async (dados: {
    codigo: string;
    nome: string;
    foto?: string;
    estoqueInicial: number;
    estoqueMinimo: number;
    estoqueMaximo: number;
    unidade: string;
  }) => {
    const { data: novo, error } = await supabase
      .from('mantimentos')
      .insert({
        codigo: dados.codigo,
        nome: dados.nome,
        foto_url: dados.foto || null,
        estoque_atual: dados.estoqueInicial,
        estoque_minimo: dados.estoqueMinimo,
        estoque_maximo: dados.estoqueMaximo,
        unidade: dados.unidade,
      })
      .select()
      .single();

    if (!error && novo && dados.estoqueInicial > 0) {
      await supabase.from('movimentacoes_mantimento').insert({
        mantimento_id: novo.id,
        tipo: 'entrada',
        quantidade: dados.estoqueInicial,
        descricao: 'Estoque inicial',
      });
    }

    await fetchMantimentos();
  };

  const atualizarFoto = async (mantimentoId: string, foto: string) => {
    await supabase.from('mantimentos').update({ foto_url: foto }).eq('id', mantimentoId);
    await fetchMantimentos();
  };

  const entradaMantimento = async (mantimentoId: string, quantidade: number, descricao: string) => {
    await supabase.from('movimentacoes_mantimento').insert({
      mantimento_id: mantimentoId,
      tipo: 'entrada',
      quantidade,
      descricao,
    });

    const { data: movs } = await supabase
      .from('movimentacoes_mantimento')
      .select('tipo, quantidade')
      .eq('mantimento_id', mantimentoId);

    const novoEstoque = (movs || []).reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + Number(m.quantidade);
      if (m.tipo === 'saida') return acc - Number(m.quantidade);
      return Number(m.quantidade); // ajuste uses absolute value
    }, 0);

    await supabase.from('mantimentos').update({ estoque_atual: Math.max(0, novoEstoque) }).eq('id', mantimentoId);
    await fetchMantimentos();
  };

  const saidaMantimento = async (mantimentoId: string, quantidade: number, descricao: string): Promise<boolean> => {
    const mantimento = mantimentos.find(m => m.id === mantimentoId);
    if (!mantimento || mantimento.estoqueAtual < quantidade) return false;

    await supabase.from('movimentacoes_mantimento').insert({
      mantimento_id: mantimentoId,
      tipo: 'saida',
      quantidade,
      descricao,
    });

    const { data: movs } = await supabase
      .from('movimentacoes_mantimento')
      .select('tipo, quantidade')
      .eq('mantimento_id', mantimentoId);

    const novoEstoque = (movs || []).reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + Number(m.quantidade);
      if (m.tipo === 'saida') return acc - Number(m.quantidade);
      return Number(m.quantidade);
    }, 0);

    await supabase.from('mantimentos').update({ estoque_atual: Math.max(0, novoEstoque) }).eq('id', mantimentoId);
    await fetchMantimentos();
    return true;
  };

  const ajustarEstoque = async (mantimentoId: string, novaQuantidade: number) => {
    const mantimento = mantimentos.find(m => m.id === mantimentoId);
    if (!mantimento) return;

    const diferenca = novaQuantidade - mantimento.estoqueAtual;
    await supabase.from('movimentacoes_mantimento').insert({
      mantimento_id: mantimentoId,
      tipo: 'ajuste',
      quantidade: diferenca,
      descricao: `Ajuste manual: ${mantimento.estoqueAtual} → ${novaQuantidade}`,
    });

    await supabase.from('mantimentos').update({ estoque_atual: novaQuantidade }).eq('id', mantimentoId);
    await fetchMantimentos();
  };

  const removerMantimento = async (mantimentoId: string) => {
    await supabase.from('mantimentos').delete().eq('id', mantimentoId);
    await fetchMantimentos();
  };

  return {
    mantimentos,
    loading,
    adicionarMantimento,
    atualizarFoto,
    entradaMantimento,
    saidaMantimento,
    ajustarEstoque,
    removerMantimento,
    fetchMantimentos,
  };
};
