import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Colaborador, MovimentacaoColaborador } from '@/types/cantina';

export const useSupabaseColaboradores = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColaboradores = useCallback(async () => {
    const { data: colabData } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome');

    const { data: movsData } = await supabase
      .from('movimentacoes_colaborador')
      .select('*')
      .order('data', { ascending: true });

    if (colabData) {
      const mapped: Colaborador[] = colabData.map(c => ({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        debito: Number(c.debito),
        dataCadastro: new Date(c.data_cadastro),
        historico: (movsData || [])
          .filter(m => m.colaborador_id === c.id)
          .map(m => ({
            id: m.id,
            tipo: m.tipo as 'debito' | 'pagamento',
            valor: Number(m.valor),
            descricao: m.descricao,
            data: new Date(m.data),
          })),
      }));
      setColaboradores(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchColaboradores();
  }, [fetchColaboradores]);

  const adicionarColaborador = async (nome: string, cargo: string) => {
    await supabase.from('colaboradores').insert({ nome, cargo });
    await fetchColaboradores();
  };

  const adicionarDebitoColaborador = async (colaboradorId: string, valor: number, descricao: string) => {
    await supabase.from('movimentacoes_colaborador').insert({
      colaborador_id: colaboradorId,
      tipo: 'debito',
      valor,
      descricao,
    });

    // Recalculate debito
    const { data: movs } = await supabase
      .from('movimentacoes_colaborador')
      .select('tipo, valor')
      .eq('colaborador_id', colaboradorId);

    const novoDebito = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'debito' ? Number(m.valor) : -Number(m.valor));
    }, 0);

    await supabase.from('colaboradores').update({ debito: Math.max(0, novoDebito) }).eq('id', colaboradorId);
    await fetchColaboradores();
  };

  const registrarPagamentoColaborador = async (colaboradorId: string, valor: number, descricao: string) => {
    await supabase.from('movimentacoes_colaborador').insert({
      colaborador_id: colaboradorId,
      tipo: 'pagamento',
      valor,
      descricao,
    });

    const { data: movs } = await supabase
      .from('movimentacoes_colaborador')
      .select('tipo, valor')
      .eq('colaborador_id', colaboradorId);

    const novoDebito = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'debito' ? Number(m.valor) : -Number(m.valor));
    }, 0);

    await supabase.from('colaboradores').update({ debito: Math.max(0, novoDebito) }).eq('id', colaboradorId);
    await fetchColaboradores();
  };

  const removerColaborador = async (colaboradorId: string) => {
    await supabase.from('colaboradores').delete().eq('id', colaboradorId);
    await fetchColaboradores();
  };

  return {
    colaboradores,
    loading,
    adicionarColaborador,
    adicionarDebitoColaborador,
    registrarPagamentoColaborador,
    removerColaborador,
    fetchColaboradores,
  };
};
