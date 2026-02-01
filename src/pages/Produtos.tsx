import { useState } from 'react';
import { useCantinaContext } from '@/contexts/CantinaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, History, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Produtos = () => {
  const { produtos, adicionarProduto, entradaEstoque, saidaEstoque, removerProduto } = useCantinaContext();
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
        <div className="grid gap-4">
          {produtosFiltrados.map((produto) => {
            const estoqueAlerta = produto.estoqueAtual <= produto.estoqueMinimo;
            
            return (
              <Card key={produto.id} className={cn(
                "bg-card shadow-card border-border",
                estoqueAlerta && "border-warning/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-products/20 flex items-center justify-center">
                        <Package className="h-6 w-6 text-products" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{produto.nome}</h3>
                          {estoqueAlerta && (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Código: {produto.codigo} • R$ {produto.preco.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Estoque</p>
                        <p className={cn(
                          "text-xl font-bold",
                          estoqueAlerta ? "text-warning" : "text-foreground"
                        )}>
                          {produto.estoqueAtual} un
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mín: {produto.estoqueMinimo}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirMovimentacao(produto.id, 'entrada')}
                          className="border-success text-success hover:bg-success/10"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirMovimentacao(produto.id, 'saida')}
                          className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirHistorico(produto.id)}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Deseja realmente remover "${produto.nome}"?`)) {
                              removerProduto(produto.id);
                              toast.success('Produto removido');
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
