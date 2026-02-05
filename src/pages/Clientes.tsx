import { useState } from 'react';
import { useCantinaContext } from '@/contexts/CantinaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, DollarSign, TrendingUp, TrendingDown, Plus, Search, PlusCircle, MinusCircle, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Clientes = () => {
  const { clientes, adicionarCliente, adicionarCredito, adicionarDebito, removerCliente } = useCantinaContext();
  const [busca, setBusca] = useState('');
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);
  
  // Estados para modais de crédito/débito
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [valorMovimentacao, setValorMovimentacao] = useState('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'credito' | 'debito'>('credito');
  const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const stats = {
    total: clientes.length,
    saldoTotal: clientes.reduce((acc, c) => acc + c.saldo, 0),
    positivos: clientes.filter(c => c.saldo >= 0).length,
    negativos: clientes.filter(c => c.saldo < 0).length,
  };

  const handleAdicionarCliente = () => {
    if (!novoClienteNome.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    adicionarCliente(novoClienteNome);
    toast.success(`Cliente "${novoClienteNome}" adicionado!`);
    setNovoClienteNome('');
    setDialogAberto(false);
  };

  const handleMovimentacao = () => {
    const valor = parseFloat(valorMovimentacao);
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!descricaoMovimentacao.trim()) {
      toast.error('Informe uma descrição');
      return;
    }
    if (!clienteSelecionado) return;

    if (tipoMovimentacao === 'credito') {
      adicionarCredito(clienteSelecionado, valor, descricaoMovimentacao);
      toast.success('Crédito adicionado com sucesso!');
    } else {
      adicionarDebito(clienteSelecionado, valor, descricaoMovimentacao);
      toast.success('Débito registrado com sucesso!');
    }

    setValorMovimentacao('');
    setDescricaoMovimentacao('');
    setDialogMovimentacao(false);
  };

  const abrirMovimentacao = (clienteId: string, tipo: 'credito' | 'debito') => {
    setClienteSelecionado(clienteId);
    setTipoMovimentacao(tipo);
    setDialogMovimentacao(true);
  };

  const abrirHistorico = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    setDialogHistorico(true);
  };

  const clienteHistorico = clientes.find(c => c.id === clienteSelecionado);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Saldo CANTINA SÊNIOR</h1>
        <p className="text-muted-foreground">Gestor de Clientes e Saldos</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className={cn(
                "text-2xl font-bold",
                stats.saldoTotal >= 0 ? "text-success" : "text-destructive"
              )}>
                R$ {stats.saldoTotal.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/20">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldos Positivos</p>
              <p className="text-2xl font-bold text-success">{stats.positivos}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/20">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldos Negativos</p>
              <p className="text-2xl font-bold text-destructive">{stats.negativos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="bg-clients hover:bg-clients/90 text-clients-foreground">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome do Cliente</Label>
                <Input
                  placeholder="Digite o nome completo"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)} className="border-border text-foreground">
                Cancelar
              </Button>
              <Button onClick={handleAdicionarCliente} className="bg-clients hover:bg-clients/90">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-muted-foreground">
              {busca ? 'Tente outro termo de busca' : 'Clique em "Adicionar Cliente" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className={cn(
              "bg-card shadow-card border-border transition-all hover:shadow-lg",
              cliente.saldo < 0 && "border-destructive/30"
            )}>
              <CardContent className="p-5">
                {/* Header com avatar e nome */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-clients/20 flex items-center justify-center shrink-0">
                    <span className="text-clients font-bold text-lg">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{cliente.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      Desde {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => abrirHistorico(cliente.id)}
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Deseja realmente remover "${cliente.nome}"?`)) {
                          removerCliente(cliente.id);
                          toast.success('Cliente removido');
                        }
                      }}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Saldo Atual */}
                <div className="text-center py-4 rounded-xl bg-secondary/50 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    cliente.saldo >= 0 ? "text-success" : "text-destructive"
                  )}>
                    R$ {cliente.saldo.toFixed(2)}
                  </p>
                </div>

                {/* Botões de ação */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => abrirMovimentacao(cliente.id, 'credito')}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Crédito
                  </Button>
                  <Button
                    onClick={() => abrirMovimentacao(cliente.id, 'debito')}
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <MinusCircle className="h-4 w-4 mr-2" />
                    Débito
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Movimentação */}
      <Dialog open={dialogMovimentacao} onOpenChange={setDialogMovimentacao}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className={tipoMovimentacao === 'credito' ? 'text-success' : 'text-destructive'}>
              {tipoMovimentacao === 'credito' ? 'Adicionar Crédito' : 'Registrar Débito'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorMovimentacao}
                onChange={(e) => setValorMovimentacao(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Descrição</Label>
              <Input
                placeholder="Ex: Recarga de saldo"
                value={descricaoMovimentacao}
                onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMovimentacao(false)} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button 
              onClick={handleMovimentacao}
              className={tipoMovimentacao === 'credito' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Histórico - {clienteHistorico?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {clienteHistorico?.historico.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              clienteHistorico?.historico.slice().reverse().map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="font-medium text-foreground">{mov.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(mov.data).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(mov.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={cn(
                    "font-bold",
                    mov.tipo === 'credito' ? 'text-success' : 'text-destructive'
                  )}>
                    {mov.tipo === 'credito' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
