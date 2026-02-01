import { useState } from 'react';
import { useCantinaContext } from '@/contexts/CantinaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserCog, Plus, Search, MinusCircle, CreditCard, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Colaboradores = () => {
  const { colaboradores, adicionarColaborador, adicionarDebitoColaborador, registrarPagamentoColaborador, removerColaborador } = useCantinaContext();
  const [busca, setBusca] = useState('');
  
  // Novo colaborador
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoColaborador, setNovoColaborador] = useState({ nome: '', cargo: '' });

  // Movimentação
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'debito' | 'pagamento'>('debito');
  const [valorMovimentacao, setValorMovimentacao] = useState('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);

  const colaboradoresFiltrados = colaboradores.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cargo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionarColaborador = () => {
    if (!novoColaborador.nome.trim() || !novoColaborador.cargo.trim()) {
      toast.error('Preencha nome e cargo');
      return;
    }
    adicionarColaborador(novoColaborador.nome, novoColaborador.cargo);
    toast.success(`Colaborador "${novoColaborador.nome}" adicionado!`);
    setNovoColaborador({ nome: '', cargo: '' });
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
    if (!colaboradorSelecionado) return;

    if (tipoMovimentacao === 'debito') {
      adicionarDebitoColaborador(colaboradorSelecionado, valor, descricaoMovimentacao);
      toast.success('Débito registrado com sucesso!');
    } else {
      registrarPagamentoColaborador(colaboradorSelecionado, valor, descricaoMovimentacao);
      toast.success('Pagamento registrado com sucesso!');
    }

    setValorMovimentacao('');
    setDescricaoMovimentacao('');
    setDialogMovimentacao(false);
  };

  const abrirMovimentacao = (colaboradorId: string, tipo: 'debito' | 'pagamento') => {
    setColaboradorSelecionado(colaboradorId);
    setTipoMovimentacao(tipo);
    setDialogMovimentacao(true);
  };

  const abrirHistorico = (colaboradorId: string) => {
    setColaboradorSelecionado(colaboradorId);
    setDialogHistorico(true);
  };

  const colaboradorHistorico = colaboradores.find(c => c.id === colaboradorSelecionado);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Colaboradores</h1>
        <p className="text-muted-foreground">Controle de Débitos</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="bg-collaborators hover:bg-collaborators/90 text-collaborators-foreground">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome do Colaborador</Label>
                <Input
                  placeholder="Digite o nome completo"
                  value={novoColaborador.nome}
                  onChange={(e) => setNovoColaborador(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Cargo</Label>
                <Input
                  placeholder="Ex: Auxiliar de Cozinha"
                  value={novoColaborador.cargo}
                  onChange={(e) => setNovoColaborador(prev => ({ ...prev, cargo: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)} className="border-border text-foreground">
                Cancelar
              </Button>
              <Button onClick={handleAdicionarColaborador} className="bg-collaborators hover:bg-collaborators/90">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Colaboradores */}
      {colaboradoresFiltrados.length === 0 ? (
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-12 text-center">
            <UserCog className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {busca ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'}
            </h3>
            <p className="text-muted-foreground">
              {busca ? 'Tente outro termo de busca' : 'Clique em "Adicionar Colaborador" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {colaboradoresFiltrados.map((colaborador) => (
            <Card key={colaborador.id} className="bg-card shadow-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-collaborators/20 flex items-center justify-center">
                      <span className="text-collaborators font-bold text-lg">
                        {colaborador.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{colaborador.nome}</h3>
                      <p className="text-sm text-muted-foreground">{colaborador.cargo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Débito</p>
                      <p className={cn(
                        "text-xl font-bold",
                        colaborador.debito > 0 ? "text-destructive" : "text-success"
                      )}>
                        R$ {colaborador.debito.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirMovimentacao(colaborador.id, 'debito')}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirMovimentacao(colaborador.id, 'pagamento')}
                        className="border-success text-success hover:bg-success/10"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirHistorico(colaborador.id)}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Deseja realmente remover "${colaborador.nome}"?`)) {
                            removerColaborador(colaborador.id);
                            toast.success('Colaborador removido');
                          }
                        }}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
            <DialogTitle className={tipoMovimentacao === 'pagamento' ? 'text-success' : 'text-destructive'}>
              {tipoMovimentacao === 'pagamento' ? 'Registrar Pagamento' : 'Registrar Débito'}
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
                placeholder="Ex: Consumo da semana"
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
              className={tipoMovimentacao === 'pagamento' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
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
              Histórico - {colaboradorHistorico?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {colaboradorHistorico?.historico.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              colaboradorHistorico?.historico.slice().reverse().map((mov) => (
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
                    mov.tipo === 'pagamento' ? 'text-success' : 'text-destructive'
                  )}>
                    {mov.tipo === 'pagamento' ? '-' : '+'} R$ {mov.valor.toFixed(2)}
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

export default Colaboradores;
