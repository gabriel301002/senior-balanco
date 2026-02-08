import React, { createContext, useContext, ReactNode } from 'react';
import { Cliente, Produto, Colaborador } from '@/types/cantina';
import { useSupabaseClientes } from '@/hooks/useSupabaseClientes';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseColaboradores } from '@/hooks/useSupabaseColaboradores';

interface CantinaContextType {
  clientes: Cliente[];
  produtos: Produto[];
  colaboradores: Colaborador[];

  // Cliente actions
  adicionarCliente: (nome: string) => void;
  adicionarCredito: (clienteId: string, valor: number, descricao: string) => void;
  adicionarDebito: (clienteId: string, valor: number, descricao: string, produtoId?: string) => void;
  removerCliente: (clienteId: string) => void;

  // Produto actions
  adicionarProduto: (codigo: string, nome: string, preco: number, estoqueInicial: number, estoqueMinimo: number, fotoUrl?: string) => void;
  entradaEstoque: (produtoId: string, quantidade: number, descricao: string) => void;
  saidaEstoque: (produtoId: string, quantidade: number, descricao: string, clienteId?: string) => void;
  removerProduto: (produtoId: string) => void;
  atualizarFotoProduto: (produtoId: string, fotoUrl: string) => void;

  // Colaborador actions
  adicionarColaborador: (nome: string, cargo: string) => void;
  adicionarDebitoColaborador: (colaboradorId: string, valor: number, descricao: string) => void;
  registrarPagamentoColaborador: (colaboradorId: string, valor: number, descricao: string) => void;
  removerColaborador: (colaboradorId: string) => void;

  // Venda integrada
  realizarVenda: (clienteId: string, produtoId: string, quantidade: number) => boolean;

  // Dashboard
  getDashboardData: (mes: number, ano: number) => {
    totalClientes: number;
    totalProdutos: number;
    saldoTotal: number;
    saldosPositivos: number;
    saldosNegativos: number;
    creditosMes: number;
    debitosMes: number;
    transacoesMes: number;
    topProdutos: { nome: string; vendas: number }[];
  };
}

const CantinaContext = createContext<CantinaContextType | undefined>(undefined);

export const useCantinaContext = () => {
  const context = useContext(CantinaContext);
  if (!context) {
    throw new Error('useCantinaContext must be used within a CantinaProvider');
  }
  return context;
};

export const CantinaProvider = ({ children }: { children: ReactNode }) => {
  const {
    clientes,
    adicionarCliente,
    adicionarCredito,
    adicionarDebito,
    removerCliente,
  } = useSupabaseClientes();

  const {
    produtos,
    adicionarProduto,
    entradaEstoque,
    saidaEstoque,
    removerProduto,
    atualizarFotoProduto,
  } = useSupabaseProdutos();

  const {
    colaboradores,
    adicionarColaborador,
    adicionarDebitoColaborador,
    registrarPagamentoColaborador,
    removerColaborador,
  } = useSupabaseColaboradores();

  // Venda integrada
  const realizarVenda = (clienteId: string, produtoId: string, quantidade: number): boolean => {
    const produto = produtos.find(p => p.id === produtoId);
    const cliente = clientes.find(c => c.id === clienteId);

    if (!produto || !cliente) return false;
    if (produto.estoqueAtual < quantidade) return false;

    const valorTotal = produto.preco * quantidade;

    // Fire both operations (async but non-blocking for UI)
    saidaEstoque(produtoId, quantidade, `Venda para ${cliente.nome}`, clienteId);
    adicionarDebito(clienteId, valorTotal, `Compra: ${quantidade}x ${produto.nome}`, produtoId);

    return true;
  };

  // Dashboard
  const getDashboardData = (mes: number, ano: number) => {
    const saldoTotal = clientes.reduce((acc, c) => acc + c.saldo, 0);
    const saldosPositivos = clientes.filter(c => c.saldo >= 0).reduce((acc, c) => acc + c.saldo, 0);
    const saldosNegativos = clientes.filter(c => c.saldo < 0).reduce((acc, c) => acc + c.saldo, 0);

    const movimentacoesMes = clientes.flatMap(c => c.historico.filter(h => {
      const data = new Date(h.data);
      return data.getMonth() === mes && data.getFullYear() === ano;
    }));

    const creditosMes = movimentacoesMes
      .filter(m => m.tipo === 'credito')
      .reduce((acc, m) => acc + m.valor, 0);

    const debitosMes = movimentacoesMes
      .filter(m => m.tipo === 'debito')
      .reduce((acc, m) => acc + m.valor, 0);

    const vendasPorProduto: Record<string, number> = {};
    produtos.forEach(p => {
      const vendas = p.historico
        .filter(h => {
          const data = new Date(h.data);
          return h.tipo === 'saida' && data.getMonth() === mes && data.getFullYear() === ano;
        })
        .reduce((acc, h) => acc + h.quantidade, 0);
      vendasPorProduto[p.nome] = vendas;
    });

    const topProdutos = Object.entries(vendasPorProduto)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, vendas]) => ({ nome, vendas }));

    return {
      totalClientes: clientes.length,
      totalProdutos: produtos.length,
      saldoTotal,
      saldosPositivos,
      saldosNegativos,
      creditosMes,
      debitosMes,
      transacoesMes: movimentacoesMes.length,
      topProdutos,
    };
  };

  return (
    <CantinaContext.Provider value={{
      clientes,
      produtos,
      colaboradores,
      adicionarCliente,
      adicionarCredito,
      adicionarDebito,
      removerCliente,
      adicionarProduto,
      entradaEstoque,
      saidaEstoque,
      removerProduto,
      atualizarFotoProduto,
      adicionarColaborador,
      adicionarDebitoColaborador,
      registrarPagamentoColaborador,
      removerColaborador,
      realizarVenda,
      getDashboardData,
    }}>
      {children}
    </CantinaContext.Provider>
  );
};
