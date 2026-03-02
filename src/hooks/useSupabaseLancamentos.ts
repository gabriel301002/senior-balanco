import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LancamentoColaborador {
  id: string;
  colaborador_id: string;
  tipo: 'falta_justificada' | 'falta_nao_justificada' | 'folga' | 'plantao_extra';
  data: string;
  atestado: boolean;
  observacao: string | null;
  created_at: string;
}

export interface ColaboradorControle {
  id: string;
  nome: string;
  cargo: string;
  status: string;
  lancamentos: LancamentoColaborador[];
}

export const useSupabaseLancamentos = () => {
  const [colaboradores, setColaboradores] = useState<ColaboradorControle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: colabs } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome');

    const { data: lancs } = await supabase
      .from('lancamentos_colaborador')
      .select('*')
      .order('data', { ascending: false });

    if (colabs) {
      const mapped: ColaboradorControle[] = colabs.map(c => ({
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        status: (c as any).status || 'ativo',
        lancamentos: (lancs || [])
          .filter(l => l.colaborador_id === c.id)
          .map(l => ({
            id: l.id,
            colaborador_id: l.colaborador_id,
            tipo: l.tipo as LancamentoColaborador['tipo'],
            data: l.data,
            atestado: l.atestado ?? false,
            observacao: l.observacao,
            created_at: l.created_at,
          })),
      }));
      setColaboradores(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const adicionarLancamento = async (
    colaboradorId: string,
    tipo: LancamentoColaborador['tipo'],
    data: string,
    atestado: boolean,
    observacao: string
  ) => {
    await supabase.from('lancamentos_colaborador').insert({
      colaborador_id: colaboradorId,
      tipo,
      data,
      atestado,
      observacao: observacao || null,
    });
    await fetchData();
  };

  const removerLancamento = async (id: string) => {
    await supabase.from('lancamentos_colaborador').delete().eq('id', id);
    await fetchData();
  };

  const atualizarStatusColaborador = async (id: string, status: string) => {
    await supabase.from('colaboradores').update({ status } as any).eq('id', id);
    await fetchData();
  };

  return {
    colaboradores,
    loading,
    adicionarLancamento,
    removerLancamento,
    atualizarStatusColaborador,
    fetchData,
  };
};
