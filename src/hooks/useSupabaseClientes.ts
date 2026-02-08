import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, MovimentacaoCliente } from '@/types/cantina';

export const useSupabaseClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');

    const { data: movsData } = await supabase
      .from('movimentacoes_cliente')
      .select('*')
      .order('data', { ascending: true });

    if (clientesData) {
      const mapped: Cliente[] = clientesData.map(c => ({
        id: c.id,
        nome: c.nome,
        saldo: Number(c.saldo),
        dataCadastro: new Date(c.data_cadastro),
        historico: (movsData || [])
          .filter(m => m.cliente_id === c.id)
          .map(m => ({
            id: m.id,
            tipo: m.tipo as 'credito' | 'debito',
            valor: Number(m.valor),
            descricao: m.descricao,
            data: new Date(m.data),
            produtoId: m.produto_id || undefined,
          })),
      }));
      setClientes(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const adicionarCliente = async (nome: string) => {
    const { error } = await supabase.from('clientes').insert({ nome });
    if (!error) await fetchClientes();
  };

  const adicionarCredito = async (clienteId: string, valor: number, descricao: string) => {
    // Insert movimentação
    await supabase.from('movimentacoes_cliente').insert({
      cliente_id: clienteId,
      tipo: 'credito',
      valor,
      descricao,
    });

    // Recalculate saldo from all movimentações
    const { data: movs } = await supabase
      .from('movimentacoes_cliente')
      .select('tipo, valor')
      .eq('cliente_id', clienteId);

    const novoSaldo = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'credito' ? Number(m.valor) : -Number(m.valor));
    }, 0);

    await supabase.from('clientes').update({ saldo: novoSaldo }).eq('id', clienteId);
    await fetchClientes();
  };

  const adicionarDebito = async (clienteId: string, valor: number, descricao: string, produtoId?: string) => {
    await supabase.from('movimentacoes_cliente').insert({
      cliente_id: clienteId,
      tipo: 'debito',
      valor,
      descricao,
      produto_id: produtoId || null,
    });

    const { data: movs } = await supabase
      .from('movimentacoes_cliente')
      .select('tipo, valor')
      .eq('cliente_id', clienteId);

    const novoSaldo = (movs || []).reduce((acc, m) => {
      return acc + (m.tipo === 'credito' ? Number(m.valor) : -Number(m.valor));
    }, 0);

    await supabase.from('clientes').update({ saldo: novoSaldo }).eq('id', clienteId);
    await fetchClientes();
  };

  const removerCliente = async (clienteId: string) => {
    // CASCADE will handle movimentações
    await supabase.from('clientes').delete().eq('id', clienteId);
    await fetchClientes();
  };

  return {
    clientes,
    loading,
    adicionarCliente,
    adicionarCredito,
    adicionarDebito,
    removerCliente,
    fetchClientes,
  };
};
