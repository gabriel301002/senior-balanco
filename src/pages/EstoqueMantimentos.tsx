import { useState, useRef } from 'react';
import { useEstoqueMantimentos } from '@/contexts/EstoqueMantimentosContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, History, Trash2, AlertTriangle, Filter, ImageIcon, Camera, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FiltroTipo = 'todos' | 'alerta' | 'sem-estoque' | 'normal';

const EstoqueMantimentos = () => {
  const { mantimentos, adicionarMantimento, atualizarFoto, entradaMantimento, saidaMantimento, ajustarEstoque, removerMantimento } = useEstoqueMantimentos();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Novo mantimento
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoMantimento, setNovoMantimento] = useState({
    codigo: '',
    nome: '',
    foto: '',
    estoqueInicial: '',
    estoqueMinimo: '',
    estoqueMaximo: '',
    unidade: 'un',
  });

  // Movimentação
  const [mantimentoSelecionado, setMantimentoSelecionado] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);

  // Ajuste manual
  const [dialogAjuste, setDialogAjuste] = useState(false);
  const [novoEstoque, setNovoEstoque] = useState('');

  // Upload de foto
  const [dialogFoto, setDialogFoto] = useState(false);
  const [fotoPreview, setFotoPreview] = useState('');

  const mantimentosFiltrados = mantimentos.filter(m => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.codigo.toLowerCase().includes(busca.toLowerCase());
    
    if (!matchBusca) return false;
    
    switch (filtro) {
      case 'alerta':
        return m.estoqueAtual <= m.estoqueMinimo && m.estoqueAtual > 0;
      case 'sem-estoque':
        return m.estoqueAtual === 0;
      case 'normal':
        return m.estoqueAtual > m.estoqueMinimo;
      default:
        return true;
    }
  });

  // Estatísticas
  const stats = {
    total: mantimentos.length,
    semEstoque: mantimentos.filter(m => m.estoqueAtual === 0).length,
    emAlerta: mantimentos.filter(m => m.estoqueAtual <= m.estoqueMinimo && m.estoqueAtual > 0).length,
    normal: mantimentos.filter(m => m.estoqueAtual > m.estoqueMinimo).length,
  };

  const handleAdicionarMantimento = () => {
    if (!novoMantimento.codigo.trim() || !novoMantimento.nome.trim()) {
      toast.error('Preencha código e nome');
      return;
    }
    
    adicionarMantimento({
      codigo: novoMantimento.codigo,
      nome: novoMantimento.nome,
      foto: novoMantimento.foto || undefined,
      estoqueInicial: parseInt(novoMantimento.estoqueInicial) || 0,
      estoqueMinimo: parseInt(novoMantimento.estoqueMinimo) || 0,
      estoqueMaximo: parseInt(novoMantimento.estoqueMaximo) || 0,
      unidade: novoMantimento.unidade,
    });
    
    toast.success(`Mantimento "${novoMantimento.nome}" adicionado!`);
    setNovoMantimento({ codigo: '', nome: '', foto: '', estoqueInicial: '', estoqueMinimo: '', estoqueMaximo: '', unidade: 'un' });
    setDialogAberto(false);
  };

  const handleMovimentacao = () => {
    const quantidade = parseInt(quantidadeMovimentacao);
    if (isNaN(quantidade) || quantidade <= 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    if (!descricaoMovimentacao.trim()) {
      toast.error('Informe uma descrição');
      return;
    }
    if (!mantimentoSelecionado) return;

    if (tipoMovimentacao === 'entrada') {
      entradaMantimento(mantimentoSelecionado, quantidade, descricaoMovimentacao);
      toast.success('Entrada registrada com sucesso!');
    } else {
      const sucesso = saidaMantimento(mantimentoSelecionado, quantidade, descricaoMovimentacao);
      if (!sucesso) {
        toast.error('Estoque insuficiente');
        return;
      }
      toast.success('Saída registrada com sucesso!');
    }

    setQuantidadeMovimentacao('');
    setDescricaoMovimentacao('');
    setDialogMovimentacao(false);
  };

  const handleAjusteManual = () => {
    const novaQtd = parseInt(novoEstoque);
    if (isNaN(novaQtd) || novaQtd < 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }
    if (!mantimentoSelecionado) return;

    ajustarEstoque(mantimentoSelecionado, novaQtd);
    toast.success('Estoque ajustado com sucesso!');
    setNovoEstoque('');
    setDialogAjuste(false);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarFoto = () => {
    if (mantimentoSelecionado && fotoPreview) {
      atualizarFoto(mantimentoSelecionado, fotoPreview);
      toast.success('Foto atualizada!');
      setFotoPreview('');
      setDialogFoto(false);
    }
  };

  const handleNovoMantimentoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovoMantimento(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const abrirMovimentacao = (mantimentoId: string, tipo: 'entrada' | 'saida') => {
    setMantimentoSelecionado(mantimentoId);
    setTipoMovimentacao(tipo);
    setDialogMovimentacao(true);
  };

  const abrirHistorico = (mantimentoId: string) => {
    setMantimentoSelecionado(mantimentoId);
    setDialogHistorico(true);
  };

  const abrirAjuste = (mantimentoId: string) => {
    const mantimento = mantimentos.find(m => m.id === mantimentoId);
    if (mantimento) {
      setMantimentoSelecionado(mantimentoId);
      setNovoEstoque(mantimento.estoqueAtual.toString());
      setDialogAjuste(true);
    }
  };

  const abrirFoto = (mantimentoId: string) => {
    setMantimentoSelecionado(mantimentoId);
    setFotoPreview('');
    setDialogFoto(true);
  };

  const mantimentoHistorico = mantimentos.find(m => m.id === mantimentoSelecionado);
  const mantimentoAjuste = mantimentos.find(m => m.id === mantimentoSelecionado);
  const mantimentoFoto = mantimentos.find(m => m.id === mantimentoSelecionado);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Estoque de Mantimentos</h1>
        <p className="text-muted-foreground">Gestão de Insumos da Empresa</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn(
          "bg-card shadow-card border-border cursor-pointer hover:border-primary/50 transition-colors",
          filtro === 'todos' && "border-primary"
        )} onClick={() => setFiltro('todos')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-card shadow-card border-border cursor-pointer hover:border-success/50 transition-colors",
          filtro === 'normal' && "border-success"
        )} onClick={() => setFiltro('normal')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/20">
              <Package className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Normal</p>
              <p className="text-2xl font-bold text-success">{stats.normal}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-card shadow-card border-border cursor-pointer hover:border-warning/50 transition-colors",
          filtro === 'alerta' && "border-warning"
        )} onClick={() => setFiltro('alerta')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/20">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Em Alerta</p>
              <p className="text-2xl font-bold text-warning">{stats.emAlerta}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-card shadow-card border-border cursor-pointer hover:border-destructive/50 transition-colors",
          filtro === 'sem-estoque' && "border-destructive"
        )} onClick={() => setFiltro('sem-estoque')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/20">
              <Package className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sem Estoque</p>
              <p className="text-2xl font-bold text-destructive">{stats.semEstoque}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroTipo)}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border text-foreground">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="normal">Estoque Normal</SelectItem>
            <SelectItem value="alerta">Em Alerta</SelectItem>
            <SelectItem value="sem-estoque">Sem Estoque</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="bg-products hover:bg-products/90 text-products-foreground">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Mantimento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Mantimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Foto Preview */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                  {novoMantimento.foto ? (
                    <img src={novoMantimento.foto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <Label className="cursor-pointer text-primary hover:underline">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNovoMantimentoFoto}
                  />
                  📷 Adicionar Foto
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Código</Label>
                  <Input
                    placeholder="Ex: M001"
                    value={novoMantimento.codigo}
                    onChange={(e) => setNovoMantimento(prev => ({ ...prev, codigo: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Unidade</Label>
                  <Select value={novoMantimento.unidade} onValueChange={(v) => setNovoMantimento(prev => ({ ...prev, unidade: v }))}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="g">Gramas</SelectItem>
                      <SelectItem value="L">Litros</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="cx">Caixa</SelectItem>
                      <SelectItem value="pct">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Nome do Mantimento</Label>
                <Input
                  placeholder="Ex: Arroz Tipo 1"
                  value={novoMantimento.nome}
                  onChange={(e) => setNovoMantimento(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Estoque Inicial</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={novoMantimento.estoqueInicial}
                    onChange={(e) => setNovoMantimento(prev => ({ ...prev, estoqueInicial: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={novoMantimento.estoqueMinimo}
                    onChange={(e) => setNovoMantimento(prev => ({ ...prev, estoqueMinimo: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-xs">Máximo</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={novoMantimento.estoqueMaximo}
                    onChange={(e) => setNovoMantimento(prev => ({ ...prev, estoqueMaximo: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)} className="border-border text-foreground">
                Cancelar
              </Button>
              <Button onClick={handleAdicionarMantimento} className="bg-products hover:bg-products/90">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Relatório Simples */}
      <Card className="bg-card shadow-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Resumo do Estoque</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Itens cadastrados</p>
              <p className="font-bold text-foreground">{stats.total}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Itens em estoque</p>
              <p className="font-bold text-foreground">{mantimentos.reduce((acc, m) => acc + m.estoqueAtual, 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Com foto</p>
              <p className="font-bold text-primary">{mantimentos.filter(m => m.foto).length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Em alerta</p>
              <p className="font-bold text-warning">{stats.emAlerta + stats.semEstoque}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mantimentos */}
      {mantimentosFiltrados.length === 0 ? (
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {busca || filtro !== 'todos' ? 'Nenhum mantimento encontrado' : 'Nenhum mantimento cadastrado'}
            </h3>
            <p className="text-muted-foreground">
              {busca || filtro !== 'todos' ? 'Tente outro termo ou filtro' : 'Clique em "Adicionar Mantimento" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mantimentosFiltrados.map((mantimento) => {
            const estoqueAlerta = mantimento.estoqueAtual <= mantimento.estoqueMinimo;
            const estoqueZero = mantimento.estoqueAtual === 0;
            
            return (
              <Card key={mantimento.id} className={cn(
                "bg-card shadow-card border-border",
                estoqueZero && "border-destructive bg-destructive/5",
                estoqueAlerta && !estoqueZero && "border-warning/50"
              )}>
                <CardContent className="p-4">
                  {/* Foto */}
                  <div 
                    className="w-full h-24 rounded-lg bg-secondary mb-3 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => abrirFoto(mantimento.id)}
                  >
                    {mantimento.foto ? (
                      <img src={mantimento.foto} alt={mantimento.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Camera className="h-8 w-8 mb-1" />
                        <span className="text-xs">Adicionar foto</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground truncate">{mantimento.nome}</h3>
                      {estoqueZero && (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-destructive text-destructive-foreground shrink-0">SEM</span>
                      )}
                      {estoqueAlerta && !estoqueZero && (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Código: {mantimento.codigo}</p>
                    
                    {/* Estoque */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estoque:</span>
                      <span className={cn(
                        "font-bold",
                        estoqueZero ? "text-destructive" : estoqueAlerta ? "text-warning" : "text-foreground"
                      )}>
                        {mantimento.estoqueAtual} {mantimento.unidade}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Min: {mantimento.estoqueMinimo}</span>
                      <span>Max: {mantimento.estoqueMaximo}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirMovimentacao(mantimento.id, 'entrada')}
                      className="flex-1 border-success text-success hover:bg-success/10 h-8"
                    >
                      <ArrowUpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirMovimentacao(mantimento.id, 'saida')}
                      className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-8"
                    >
                      <ArrowDownCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirAjuste(mantimento.id)}
                      className="border-primary text-primary hover:bg-primary/10 h-8 px-2"
                    >
                      Ajuste
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => abrirHistorico(mantimento.id)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Deseja remover "${mantimento.nome}"?`)) {
                          removerMantimento(mantimento.id);
                          toast.success('Mantimento removido');
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Movimentação */}
      <Dialog open={dialogMovimentacao} onOpenChange={setDialogMovimentacao}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className={tipoMovimentacao === 'entrada' ? 'text-success' : 'text-destructive'}>
              {tipoMovimentacao === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Quantidade</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantidadeMovimentacao}
                onChange={(e) => setQuantidadeMovimentacao(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Descrição</Label>
              <Input
                placeholder="Ex: Compra semanal"
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
              className={tipoMovimentacao === 'entrada' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ajuste Manual */}
      <Dialog open={dialogAjuste} onOpenChange={setDialogAjuste}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Ajuste Manual - {mantimentoAjuste?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-sm text-muted-foreground">Estoque Atual</p>
              <p className="text-2xl font-bold text-foreground">{mantimentoAjuste?.estoqueAtual} {mantimentoAjuste?.unidade}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Novo Estoque</Label>
              <Input
                type="number"
                placeholder="0"
                value={novoEstoque}
                onChange={(e) => setNovoEstoque(e.target.value)}
                className="bg-secondary border-border text-foreground text-center text-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAjuste(false)} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button onClick={handleAjusteManual} className="bg-primary hover:bg-primary/90">
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Foto */}
      <Dialog open={dialogFoto} onOpenChange={setDialogFoto}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Foto - {mantimentoFoto?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="w-full h-48 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : mantimentoFoto?.foto ? (
                <img src={mantimentoFoto.foto} alt={mantimentoFoto.nome} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <Label className="flex items-center justify-center cursor-pointer text-primary hover:underline">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFotoUpload}
              />
              <Camera className="h-4 w-4 mr-2" />
              Selecionar nova foto
            </Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogFoto(false)} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarFoto} 
              disabled={!fotoPreview}
              className="bg-primary hover:bg-primary/90"
            >
              Salvar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Histórico - {mantimentoHistorico?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {mantimentoHistorico?.historico.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              mantimentoHistorico?.historico.slice().reverse().map((mov) => (
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
                    mov.tipo === 'entrada' ? 'text-success' : mov.tipo === 'saida' ? 'text-destructive' : 'text-primary'
                  )}>
                    {mov.tipo === 'entrada' ? '+' : mov.tipo === 'saida' ? '-' : '~'} {Math.abs(mov.quantidade)} {mantimentoHistorico?.unidade}
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

export default EstoqueMantimentos;
