import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseMantimentos } from '@/hooks/useSupabaseMantimentos';

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

export const EstoqueMantimentosProvider = ({ children }: { children: ReactNode }) => {
  const {
    mantimentos,
    adicionarMantimento,
    atualizarFoto,
    entradaMantimento,
    saidaMantimento: saidaMantimentoAsync,
    ajustarEstoque,
    removerMantimento,
  } = useSupabaseMantimentos();

  // Wrap saidaMantimento to maintain sync return type for compatibility
  const saidaMantimento = (mantimentoId: string, quantidade: number, descricao: string): boolean => {
    const mantimento = mantimentos.find(m => m.id === mantimentoId);
    if (!mantimento || mantimento.estoqueAtual < quantidade) return false;
    saidaMantimentoAsync(mantimentoId, quantidade, descricao);
    return true;
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
