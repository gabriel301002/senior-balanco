import { useState } from 'react';
import { useCantinaContext } from '@/contexts/CantinaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, History, Trash2, AlertTriangle, ShoppingCart, Minus, ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Produtos = () => {
  const { produtos, clientes, colaboradores, adicionarProduto, entradaEstoque, saidaEstoque, removerProduto, realizarVenda, adicionarDebitoColaborador } = useCantinaContext();
  const [busca, setBusca] = useState('');
  
  // Novo produto
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    codigo: '',
    nome: '',
    preco: '',
    estoqueInicial: '',
    estoqueMinimo: '',
  });

  // Movimentação de estoque
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [quantidadeMovimentacao, setQuantidadeMovimentacao] = useState('');
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState('');
  const [dialogMovimentacao, setDialogMovimentacao] = useState(false);
  const [dialogHistorico, setDialogHistorico] = useState(false);

  // Venda
  const [dialogVenda, setDialogVenda] = useState(false);
  const [vendaCompradorTipo, setVendaCompradorTipo] = useState<'cliente' | 'colaborador'>('cliente');
  const [vendaCompradorId, setVendaCompradorId] = useState('');
  const [vendaQuantidade, setVendaQuantidade] = useState(1);

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionarProduto = () => {
    if (!novoProduto.codigo.trim() || !novoProduto.nome.trim()) {
      toast.error('Preencha código e nome');
      return;
    }
    const preco = parseFloat(novoProduto.preco);
    const estoqueInicial = parseInt(novoProduto.estoqueInicial) || 0;
    const estoqueMinimo = parseInt(novoProduto.estoqueMinimo) || 0;

    if (isNaN(preco) || preco < 0) {
      toast.error('Informe um preço válido');
      return;
    }

    adicionarProduto(novoProduto.codigo, novoProduto.nome, preco, estoqueInicial, estoqueMinimo);
    toast.success(`Produto "${novoProduto.nome}" adicionado!`);
    setNovoProduto({ codigo: '', nome: '', preco: '', estoqueInicial: '', estoqueMinimo: '' });
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
    if (!produtoSelecionado) return;

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (tipoMovimentacao === 'saida' && produto && produto.estoqueAtual < quantidade) {
      toast.error('Estoque insuficiente');
      return;
    }

    if (tipoMovimentacao === 'entrada') {
      entradaEstoque(produtoSelecionado, quantidade, descricaoMovimentacao);
      toast.success('Entrada registrada com sucesso!');
    } else {
      saidaEstoque(produtoSelecionado, quantidade, descricaoMovimentacao);
      toast.success('Saída registrada com sucesso!');
    }

    setQuantidadeMovimentacao('');
    setDescricaoMovimentacao('');
    setDialogMovimentacao(false);
  };

  const abrirMovimentacao = (produtoId: string, tipo: 'entrada' | 'saida') => {
    setProdutoSelecionado(produtoId);
    setTipoMovimentacao(tipo);
    setDialogMovimentacao(true);
  };

  const abrirHistorico = (produtoId: string) => {
    setProdutoSelecionado(produtoId);
    setDialogHistorico(true);
  };

  const abrirVenda = (produtoId: string) => {
    setProdutoSelecionado(produtoId);
    setVendaQuantidade(1);
    setVendaCompradorId('');
    setDialogVenda(true);
  };

  const handleVenda = () => {
    if (!produtoSelecionado || !vendaCompradorId) {
      toast.error('Selecione quem está comprando');
      return;
    }

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) return;

    if (produto.estoqueAtual < vendaQuantidade) {
      toast.error('Estoque insuficiente');
      return;
    }

    if (vendaCompradorTipo === 'cliente') {
      const sucesso = realizarVenda(vendaCompradorId, produtoSelecionado, vendaQuantidade);
      if (sucesso) {
        const cliente = clientes.find(c => c.id === vendaCompradorId);
        toast.success(`Venda realizada para ${cliente?.nome}!`);
        setDialogVenda(false);
      } else {
        toast.error('Erro ao realizar venda');
      }
    } else {
      // Venda para colaborador
      const colaborador = colaboradores.find(c => c.id === vendaCompradorId);
      if (colaborador) {
        const valorTotal = produto.preco * vendaQuantidade;
        saidaEstoque(produtoSelecionado, vendaQuantidade, `Venda para ${colaborador.nome}`);
        adicionarDebitoColaborador(vendaCompradorId, valorTotal, `Compra: ${vendaQuantidade}x ${produto.nome}`);
        toast.success(`Venda realizada para ${colaborador.nome}!`);
        setDialogVenda(false);
      }
    }
  };

  const produtoVenda = produtos.find(p => p.id === produtoSelecionado);
  const valorTotalVenda = produtoVenda ? produtoVenda.preco * vendaQuantidade : 0;

  const produtoHistorico = produtos.find(p => p.id === produtoSelecionado);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Gestão de Produtos</h1>
        <p className="text-muted-foreground">Controle de Estoque da Cantina</p>
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
        
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button className="bg-products hover:bg-products/90 text-products-foreground">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Código</Label>
                  <Input
                    placeholder="Ex: 001"
                    value={novoProduto.codigo}
                    onChange={(e) => setNovoProduto(prev => ({ ...prev, codigo: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novoProduto.preco}
                    onChange={(e) => setNovoProduto(prev => ({ ...prev, preco: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Nome do Produto</Label>
                <Input
                  placeholder="Ex: Salgado de Frango"
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Estoque Inicial</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={novoProduto.estoqueInicial}
                    onChange={(e) => setNovoProduto(prev => ({ ...prev, estoqueInicial: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Estoque Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={novoProduto.estoqueMinimo}
                    onChange={(e) => setNovoProduto(prev => ({ ...prev, estoqueMinimo: e.target.value }))}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogAberto(false)} className="border-border text-foreground">
                Cancelar
              </Button>
              <Button onClick={handleAdicionarProduto} className="bg-products hover:bg-products/90">
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <Card className="bg-card shadow-card border-border">
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </h3>
            <p className="text-muted-foreground">
              {busca ? 'Tente outro termo de busca' : 'Clique em "Adicionar Produto" para começar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtosFiltrados.map((produto) => {
            const estoqueAlerta = produto.estoqueAtual <= produto.estoqueMinimo;
            const estoqueZero = produto.estoqueAtual === 0;
            
            return (
              <Card key={produto.id} className={cn(
                "bg-card shadow-card border-border",
                estoqueZero && "border-destructive bg-destructive/5",
                estoqueAlerta && !estoqueZero && "border-warning/50"
              )}>
                <CardContent className="p-4 space-y-4">
                  {/* Header com foto e ações */}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center shrink-0",
                      estoqueZero ? "bg-destructive/20" : "bg-products/20"
                    )}>
                      <ImageIcon className={cn(
                        "h-8 w-8",
                        estoqueZero ? "text-destructive" : "text-products"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{produto.nome}</h3>
                        {estoqueZero && (
                          <span className="px-2 py-0.5 text-xs rounded bg-destructive text-destructive-foreground">SEM ESTOQUE</span>
                        )}
                        {estoqueAlerta && !estoqueZero && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Código: {produto.codigo}</p>
                      <p className="text-lg font-bold text-primary">R$ {produto.preco.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="grid grid-cols-2 gap-2 text-center p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Estoque Atual</p>
                      <p className={cn(
                        "text-xl font-bold",
                        estoqueZero ? "text-destructive" : estoqueAlerta ? "text-warning" : "text-foreground"
                      )}>
                        {produto.estoqueAtual}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estoque Mínimo</p>
                      <p className="text-xl font-bold text-muted-foreground">
                        {produto.estoqueMinimo}
                      </p>
                    </div>
                  </div>

                  {/* Botão Vender */}
                  <Button
                    onClick={() => abrirVenda(produto.id)}
                    disabled={estoqueZero}
                    className="w-full bg-products hover:bg-products/90 text-products-foreground"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    VENDER
                  </Button>

                  {/* Ações secundárias */}
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirMovimentacao(produto.id, 'entrada')}
                      className="border-success text-success hover:bg-success/10"
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-1" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirMovimentacao(produto.id, 'saida')}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-1" />
                      Saída
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => abrirHistorico(produto.id)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Deseja realmente remover "${produto.nome}"?`)) {
                          removerProduto(produto.id);
                          toast.success('Produto removido');
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10"
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

      {/* Dialog Venda */}
      <Dialog open={dialogVenda} onOpenChange={setDialogVenda}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-products flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Realizar Venda
            </DialogTitle>
          </DialogHeader>
          
          {produtoVenda && (
            <div className="space-y-4 py-4">
              {/* Produto info */}
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <p className="text-lg font-bold text-foreground">{produtoVenda.nome}</p>
                <p className="text-2xl font-bold text-primary">R$ {produtoVenda.preco.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Estoque: {produtoVenda.estoqueAtual} un</p>
              </div>

              {/* Tipo de comprador */}
              <div className="space-y-2">
                <Label className="text-foreground">Tipo de Comprador</Label>
                <Select value={vendaCompradorTipo} onValueChange={(v) => {
                  setVendaCompradorTipo(v as 'cliente' | 'colaborador');
                  setVendaCompradorId('');
                }}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selecionar comprador */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  {vendaCompradorTipo === 'cliente' ? 'Cliente' : 'Colaborador'}
                </Label>
                <Select value={vendaCompradorId} onValueChange={setVendaCompradorId}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione quem está comprando..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendaCompradorTipo === 'cliente' ? (
                      clientes.length === 0 ? (
                        <SelectItem value="" disabled>Nenhum cliente cadastrado</SelectItem>
                      ) : (
                        clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} (Saldo: R$ {c.saldo.toFixed(2)})
                          </SelectItem>
                        ))
                      )
                    ) : (
                      colaboradores.length === 0 ? (
                        <SelectItem value="" disabled>Nenhum colaborador cadastrado</SelectItem>
                      ) : (
                        colaboradores.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome} - {c.cargo}
                          </SelectItem>
                        ))
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label className="text-foreground">Quantidade</Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setVendaQuantidade(q => Math.max(1, q - 1))}
                    className="h-12 w-12 rounded-full border-border"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="text-3xl font-bold text-foreground w-16 text-center">
                    {vendaQuantidade}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setVendaQuantidade(q => Math.min(produtoVenda.estoqueAtual, q + 1))}
                    className="h-12 w-12 rounded-full border-border"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-products/10 text-center">
                <p className="text-sm text-muted-foreground">Total da Venda</p>
                <p className="text-3xl font-bold text-products">R$ {valorTotalVenda.toFixed(2)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogVenda(false)} className="border-border text-foreground">
              Cancelar
            </Button>
            <Button onClick={handleVenda} className="bg-products hover:bg-products/90">
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                placeholder="Ex: Reposição de estoque"
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

      {/* Dialog Histórico */}
      <Dialog open={dialogHistorico} onOpenChange={setDialogHistorico}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Histórico - {produtoHistorico?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {produtoHistorico?.historico.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              produtoHistorico?.historico.slice().reverse().map((mov) => (
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
                    mov.tipo === 'entrada' ? 'text-success' : 'text-destructive'
                  )}>
                    {mov.tipo === 'entrada' ? '+' : '-'} {mov.quantidade} un
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

export default Produtos;
