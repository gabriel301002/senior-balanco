// Sistema de Gestão de Cantina - Types

export interface Cliente {
  id: string;
  nome: string;
  saldo: number;
  dataCadastro: Date;
  historico: MovimentacaoCliente[];
}

export interface MovimentacaoCliente {
  id: string;
  tipo: 'credito' | 'debito';
  valor: number;
  descricao: string;
  data: Date;
  produtoId?: string;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  preco: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fotoUrl?: string;
  dataCadastro: Date;
  historico: MovimentacaoEstoque[];
}

export interface MovimentacaoEstoque {
  id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  descricao: string;
  data: Date;
  clienteId?: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  debito: number;
  dataCadastro: Date;
  historico: MovimentacaoColaborador[];
}

export interface MovimentacaoColaborador {
  id: string;
  tipo: 'debito' | 'pagamento';
  valor: number;
  descricao: string;
  data: Date;
}

export interface Venda {
  id: string;
  clienteId: string;
  produtoId: string;
  quantidade: number;
  valorTotal: number;
  data: Date;
}

export interface DashboardData {
  totalClientes: number;
  totalProdutos: number;
  saldoTotal: number;
  saldosPositivos: number;
  saldosNegativos: number;
  creditosMes: number;
  debitosMes: number;
  transacoesMes: number;
  topProdutos: { produto: Produto; vendas: number }[];
}
