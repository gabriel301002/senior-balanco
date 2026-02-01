import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Cliente, Produto, Colaborador, MovimentacaoCliente, MovimentacaoEstoque, MovimentacaoColaborador } from '@/types/cantina';

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
  adicionarProduto: (codigo: string, nome: string, preco: number, estoqueInicial: number, estoqueMinimo: number) => void;
  entradaEstoque: (produtoId: string, quantidade: number, descricao: string) => void;
  saidaEstoque: (produtoId: string, quantidade: number, descricao: string, clienteId?: string) => void;
  removerProduto: (produtoId: string) => void;
  
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

const generateId = () => Math.random().toString(36).substr(2, 9);

export const CantinaProvider = ({ children }: { children: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // Cliente actions
  const adicionarCliente = (nome: string) => {
    const novoCliente: Cliente = {
      id: generateId(),
      nome,
      saldo: 0,
      dataCadastro: new Date(),
      historico: [],
    };
    setClientes(prev => [...prev, novoCliente]);
  };

  const adicionarCredito = (clienteId: string, valor: number, descricao: string) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        const movimentacao: MovimentacaoCliente = {
          id: generateId(),
          tipo: 'credito',
          valor,
          descricao,
          data: new Date(),
        };
        return {
          ...cliente,
          saldo: cliente.saldo + valor,
          historico: [...cliente.historico, movimentacao],
        };
      }
      return cliente;
    }));
  };

  const adicionarDebito = (clienteId: string, valor: number, descricao: string, produtoId?: string) => {
    setClientes(prev => prev.map(cliente => {
      if (cliente.id === clienteId) {
        const movimentacao: MovimentacaoCliente = {
          id: generateId(),
          tipo: 'debito',
          valor,
          descricao,
          data: new Date(),
          produtoId,
        };
        return {
          ...cliente,
          saldo: cliente.saldo - valor,
          historico: [...cliente.historico, movimentacao],
        };
      }
      return cliente;
    }));
  };

  const removerCliente = (clienteId: string) => {
    setClientes(prev => prev.filter(c => c.id !== clienteId));
  };

  // Produto actions
  const adicionarProduto = (codigo: string, nome: string, preco: number, estoqueInicial: number, estoqueMinimo: number) => {
    const novoProduto: Produto = {
      id: generateId(),
      codigo,
      nome,
      preco,
      estoqueAtual: estoqueInicial,
      estoqueMinimo,
      dataCadastro: new Date(),
      historico: estoqueInicial > 0 ? [{
        id: generateId(),
        tipo: 'entrada',
        quantidade: estoqueInicial,
        descricao: 'Estoque inicial',
        data: new Date(),
      }] : [],
    };
    setProdutos(prev => [...prev, novoProduto]);
  };

  const entradaEstoque = (produtoId: string, quantidade: number, descricao: string) => {
    setProdutos(prev => prev.map(produto => {
      if (produto.id === produtoId) {
        const movimentacao: MovimentacaoEstoque = {
          id: generateId(),
          tipo: 'entrada',
          quantidade,
          descricao,
          data: new Date(),
        };
        return {
          ...produto,
          estoqueAtual: produto.estoqueAtual + quantidade,
          historico: [...produto.historico, movimentacao],
        };
      }
      return produto;
    }));
  };

  const saidaEstoque = (produtoId: string, quantidade: number, descricao: string, clienteId?: string) => {
    setProdutos(prev => prev.map(produto => {
      if (produto.id === produtoId && produto.estoqueAtual >= quantidade) {
        const movimentacao: MovimentacaoEstoque = {
          id: generateId(),
          tipo: 'saida',
          quantidade,
          descricao,
          data: new Date(),
          clienteId,
        };
        return {
          ...produto,
          estoqueAtual: produto.estoqueAtual - quantidade,
          historico: [...produto.historico, movimentacao],
        };
      }
      return produto;
    }));
  };

  const removerProduto = (produtoId: string) => {
    setProdutos(prev => prev.filter(p => p.id !== produtoId));
  };

  // Colaborador actions
  const adicionarColaborador = (nome: string, cargo: string) => {
    const novoColaborador: Colaborador = {
      id: generateId(),
      nome,
      cargo,
      debito: 0,
      dataCadastro: new Date(),
      historico: [],
    };
    setColaboradores(prev => [...prev, novoColaborador]);
  };

  const adicionarDebitoColaborador = (colaboradorId: string, valor: number, descricao: string) => {
    setColaboradores(prev => prev.map(colab => {
      if (colab.id === colaboradorId) {
        const movimentacao: MovimentacaoColaborador = {
          id: generateId(),
          tipo: 'debito',
          valor,
          descricao,
          data: new Date(),
        };
        return {
          ...colab,
          debito: colab.debito + valor,
          historico: [...colab.historico, movimentacao],
        };
      }
      return colab;
    }));
  };

  const registrarPagamentoColaborador = (colaboradorId: string, valor: number, descricao: string) => {
    setColaboradores(prev => prev.map(colab => {
      if (colab.id === colaboradorId) {
        const movimentacao: MovimentacaoColaborador = {
          id: generateId(),
          tipo: 'pagamento',
          valor,
          descricao,
          data: new Date(),
        };
        return {
          ...colab,
          debito: Math.max(0, colab.debito - valor),
          historico: [...colab.historico, movimentacao],
        };
      }
      return colab;
    }));
  };

  const removerColaborador = (colaboradorId: string) => {
    setColaboradores(prev => prev.filter(c => c.id !== colaboradorId));
  };

  // Venda integrada
  const realizarVenda = (clienteId: string, produtoId: string, quantidade: number): boolean => {
    const produto = produtos.find(p => p.id === produtoId);
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (!produto || !cliente) return false;
    if (produto.estoqueAtual < quantidade) return false;
    
    const valorTotal = produto.preco * quantidade;
    
    // Operação atômica: débito do cliente + saída de estoque
    saidaEstoque(produtoId, quantidade, `Venda para ${cliente.nome}`, clienteId);
    adicionarDebito(clienteId, valorTotal, `Compra: ${quantidade}x ${produto.nome}`, produtoId);
    
    return true;
  };

  // Dashboard
  const getDashboardData = (mes: number, ano: number) => {
    const saldoTotal = clientes.reduce((acc, c) => acc + c.saldo, 0);
    const saldosPositivos = clientes.filter(c => c.saldo >= 0).reduce((acc, c) => acc + c.saldo, 0);
    const saldosNegativos = clientes.filter(c => c.saldo < 0).reduce((acc, c) => acc + c.saldo, 0);

    // Filtrar movimentações do mês
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

    // Top produtos (por saídas do mês)
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
