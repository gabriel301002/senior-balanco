import { useState } from 'react';
import { useCantinaContext } from '@/contexts/CantinaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Package, CreditCard, TrendingUp, BarChart3, DollarSign, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardPasswordGate from '@/components/DashboardPasswordGate';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const anos = [2024, 2025, 2026, 2027];

const DashboardContent = () => {
  const { getDashboardData, clientes } = useCantinaContext();
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [abaAtiva, setAbaAtiva] = useState('resumo');

  const dados = getDashboardData(mesSelecionado, anoSelecionado);
  const saldoLiquido = dados.creditosMes - dados.debitosMes;

  const clientesComCreditos = clientes
    .map(cliente => {
      const creditosManuais = cliente.historico.filter(h => {
        const data = new Date(h.data);
        return h.tipo === 'credito' &&
               data.getMonth() === mesSelecionado &&
               data.getFullYear() === anoSelecionado;
      });
      const totalCreditos = creditosManuais.reduce((acc, m) => acc + m.valor, 0);
      return { ...cliente, creditosManuais, totalCreditos };
    })
    .filter(c => c.creditosManuais.length > 0)
    .sort((a, b) => b.totalCreditos - a.totalCreditos);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Geral & Relatórios</h1>
          <p className="text-muted-foreground">Visão consolidada da cantina</p>
        </div>
        <div className="flex gap-3">
          <Select value={mesSelecionado.toString()} onValueChange={(v) => setMesSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[140px] bg-secondary border-border text-foreground">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {meses.map((mes, idx) => (
                <SelectItem key={idx} value={idx.toString()} className="text-foreground hover:bg-accent">
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={anoSelecionado.toString()} onValueChange={(v) => setAnoSelecionado(parseInt(v))}>
            <SelectTrigger className="w-[100px] bg-secondary border-border text-foreground">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {anos.map((ano) => (
                <SelectItem key={ano} value={ano.toString()} className="text-foreground hover:bg-accent">
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-clients/20">
              <Users className="h-6 w-6 text-clients" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-foreground">{dados.totalClientes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-products/20">
              <Package className="h-6 w-6 text-products" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-2xl font-bold text-foreground">{dados.totalProdutos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/20">
              <CreditCard className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créditos do Mês</p>
              <p className="text-2xl font-bold text-success">R$ {dados.creditosMes.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", saldoLiquido >= 0 ? "bg-success/20" : "bg-destructive/20")}>
              <TrendingUp className={cn("h-6 w-6", saldoLiquido >= 0 ? "text-success" : "text-destructive")} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Líquido</p>
              <p className={cn("text-2xl font-bold", saldoLiquido >= 0 ? "text-success" : "text-destructive")}>
                R$ {saldoLiquido.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-secondary">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Resumo Geral
          </TabsTrigger>
          <TabsTrigger value="creditos" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            Créditos Manuais ({clientesComCreditos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="h-5 w-5 text-products" />
                  Top 5 Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dados.topProdutos.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma venda no período</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dados.topProdutos.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-products/20 flex items-center justify-center">
                          <span className="text-products font-bold text-sm">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.nome}</p>
                          <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-products rounded-full transition-all"
                              style={{
                                width: `${(item.vendas / Math.max(...dados.topProdutos.map(p => p.vendas))) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-muted-foreground font-medium">{item.vendas} un</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Resumo Financeiro Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-success/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/20">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <span className="font-medium text-foreground">Total de Créditos</span>
                  </div>
                  <span className="text-xl font-bold text-success">R$ {dados.creditosMes.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/20">
                      <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
                    </div>
                    <span className="font-medium text-foreground">Total de Débitos</span>
                  </div>
                  <span className="text-xl font-bold text-destructive">R$ {dados.debitosMes.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <ArrowUpDown className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Transações</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{dados.transacoesMes}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-foreground">Saldo Total Clientes</span>
                    <span className={cn("text-2xl font-bold", dados.saldoTotal >= 0 ? "text-success" : "text-destructive")}>
                      R$ {dados.saldoTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-success">↑ R$ {dados.saldosPositivos.toFixed(2)}</span>
                    <span className="text-destructive">↓ R$ {Math.abs(dados.saldosNegativos).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="creditos" className="mt-6">
          <Card className="bg-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5 text-success" />
                Clientes com Créditos Manuais em {meses[mesSelecionado]}/{anoSelecionado}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientesComCreditos.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum crédito manual registrado neste período</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientesComCreditos.map((cliente) => (
                    <div key={cliente.id} className="p-4 rounded-xl bg-secondary/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-clients/20 flex items-center justify-center">
                            <span className="text-clients font-bold">
                              {cliente.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{cliente.nome}</h4>
                            <p className="text-sm text-muted-foreground">{cliente.creditosManuais.length} crédito(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total recebido</p>
                          <p className="text-xl font-bold text-success">R$ {cliente.totalCreditos.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        {cliente.creditosManuais.map((mov) => (
                          <div key={mov.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-foreground">{mov.descricao}</span>
                              <span className="text-muted-foreground ml-2">
                                ({new Date(mov.data).toLocaleDateString('pt-BR')})
                              </span>
                            </div>
                            <span className="text-success font-medium">+ R$ {mov.valor.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardPasswordGate>
      <DashboardContent />
    </DashboardPasswordGate>
  );
};

export default Dashboard;
