import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Mantimento {
  id: string;
  codigo: string;
  nome: string;
  foto?: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  unidade: string;
  dataCadastro: Date;
  historico: MovimentacaoMantimento[];
}

export interface MovimentacaoMantimento {
  id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  descricao: string;
  data: Date;
}

interface EstoqueMantimentosContextType {
  mantimentos: Mantimento[];
  
  adicionarMantimento: (dados: {
    codigo: string;
    nome: string;
    foto?: string;
    estoqueInicial: number;
    estoqueMinimo: number;
    estoqueMaximo: number;
    unidade: string;
  }) => void;
  
  atualizarFoto: (mantimentoId: string, foto: string) => void;
  entradaMantimento: (mantimentoId: string, quantidade: number, descricao: string) => void;
  saidaMantimento: (mantimentoId: string, quantidade: number, descricao: string) => boolean;
  ajustarEstoque: (mantimentoId: string, novaQuantidade: number) => void;
  removerMantimento: (mantimentoId: string) => void;
}

const EstoqueMantimentosContext = createContext<EstoqueMantimentosContextType | undefined>(undefined);

export const useEstoqueMantimentos = () => {
  const context = useContext(EstoqueMantimentosContext);
  if (!context) {
    throw new Error('useEstoqueMantimentos must be used within a EstoqueMantimentosProvider');
  }
  return context;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const EstoqueMantimentosProvider = ({ children }: { children: ReactNode }) => {
  const [mantimentos, setMantimentos] = useState<Mantimento[]>([]);

  const adicionarMantimento = (dados: {
    codigo: string;
    nome: string;
    foto?: string;
    estoqueInicial: number;
    estoqueMinimo: number;
    estoqueMaximo: number;
    unidade: string;
  }) => {
    const novoMantimento: Mantimento = {
      id: generateId(),
      codigo: dados.codigo,
      nome: dados.nome,
      foto: dados.foto,
      estoqueAtual: dados.estoqueInicial,
      estoqueMinimo: dados.estoqueMinimo,
      estoqueMaximo: dados.estoqueMaximo,
      unidade: dados.unidade,
      dataCadastro: new Date(),
      historico: dados.estoqueInicial > 0 ? [{
        id: generateId(),
        tipo: 'entrada',
        quantidade: dados.estoqueInicial,
        descricao: 'Estoque inicial',
        data: new Date(),
      }] : [],
    };
    setMantimentos(prev => [...prev, novoMantimento]);
  };

  const atualizarFoto = (mantimentoId: string, foto: string) => {
    setMantimentos(prev => prev.map(m => 
      m.id === mantimentoId ? { ...m, foto } : m
    ));
  };

  const entradaMantimento = (mantimentoId: string, quantidade: number, descricao: string) => {
    setMantimentos(prev => prev.map(m => {
      if (m.id === mantimentoId) {
        const movimentacao: MovimentacaoMantimento = {
          id: generateId(),
          tipo: 'entrada',
          quantidade,
          descricao,
          data: new Date(),
        };
        return {
          ...m,
          estoqueAtual: m.estoqueAtual + quantidade,
          historico: [...m.historico, movimentacao],
        };
      }
      return m;
    }));
  };

  const saidaMantimento = (mantimentoId: string, quantidade: number, descricao: string): boolean => {
    const mantimento = mantimentos.find(m => m.id === mantimentoId);
    if (!mantimento || mantimento.estoqueAtual < quantidade) return false;

    setMantimentos(prev => prev.map(m => {
      if (m.id === mantimentoId) {
        const movimentacao: MovimentacaoMantimento = {
          id: generateId(),
          tipo: 'saida',
          quantidade,
          descricao,
          data: new Date(),
        };
        return {
          ...m,
          estoqueAtual: m.estoqueAtual - quantidade,
          historico: [...m.historico, movimentacao],
        };
      }
      return m;
    }));
    return true;
  };

  const ajustarEstoque = (mantimentoId: string, novaQuantidade: number) => {
    setMantimentos(prev => prev.map(m => {
      if (m.id === mantimentoId) {
        const diferenca = novaQuantidade - m.estoqueAtual;
        const movimentacao: MovimentacaoMantimento = {
          id: generateId(),
          tipo: 'ajuste',
          quantidade: diferenca,
          descricao: `Ajuste manual: ${m.estoqueAtual} → ${novaQuantidade}`,
          data: new Date(),
        };
        return {
          ...m,
          estoqueAtual: novaQuantidade,
          historico: [...m.historico, movimentacao],
        };
      }
      return m;
    }));
  };

  const removerMantimento = (mantimentoId: string) => {
    setMantimentos(prev => prev.filter(m => m.id !== mantimentoId));
  };

  return (
    <EstoqueMantimentosContext.Provider value={{
      mantimentos,
      adicionarMantimento,
      atualizarFoto,
      entradaMantimento,
      saidaMantimento,
      ajustarEstoque,
      removerMantimento,
    }}>
      {children}
    </EstoqueMantimentosContext.Provider>
  );
};
