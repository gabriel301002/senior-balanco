 import { useState } from 'react';
 import { useCantinaContext } from '@/contexts/CantinaContext';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent } from '@/components/ui/card';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Package, Plus, Search, ArrowUpCircle, ArrowDownCircle, History, Trash2, AlertTriangle, Filter, ImageIcon, FileText } from 'lucide-react';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';

 type FiltroTipo = 'todos' | 'alerta' | 'sem-estoque' | 'normal';

 const ControleEstoque = () => {
   const { produtos, adicionarProduto, entradaEstoque, saidaEstoque, removerProduto } = useCantinaContext();
   const [busca, setBusca] = useState('');
   const [filtro, setFiltro] = useState<FiltroTipo>('todos');
   
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

   // Ajuste manual
   const [dialogAjuste, setDialogAjuste] = useState(false);
   const [novoEstoque, setNovoEstoque] = useState('');

   const produtosFiltrados = produtos.filter(p => {
     const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
       p.codigo.toLowerCase().includes(busca.toLowerCase());
     
     if (!matchBusca) return false;
     
     switch (filtro) {
       case 'alerta':
         return p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0;
       case 'sem-estoque':
         return p.estoqueAtual === 0;
       case 'normal':
         return p.estoqueAtual > p.estoqueMinimo;
       default:
         return true;
     }
   });

   // Estatísticas
   const stats = {
     total: produtos.length,
     semEstoque: produtos.filter(p => p.estoqueAtual === 0).length,
     emAlerta: produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo && p.estoqueAtual > 0).length,
     normal: produtos.filter(p => p.estoqueAtual > p.estoqueMinimo).length,
   };

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

   const handleAjusteManual = () => {
     const novaQtd = parseInt(novoEstoque);
     if (isNaN(novaQtd) || novaQtd < 0) {
       toast.error('Informe uma quantidade válida');
       return;
     }
     if (!produtoSelecionado) return;

     const produto = produtos.find(p => p.id === produtoSelecionado);
     if (!produto) return;

     const diferenca = novaQtd - produto.estoqueAtual;
     if (diferenca > 0) {
       entradaEstoque(produtoSelecionado, diferenca, 'Ajuste manual de estoque');
     } else if (diferenca < 0) {
       saidaEstoque(produtoSelecionado, Math.abs(diferenca), 'Ajuste manual de estoque');
     }
     
     toast.success('Estoque ajustado com sucesso!');
     setNovoEstoque('');
     setDialogAjuste(false);
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

   const abrirAjuste = (produtoId: string) => {
     const produto = produtos.find(p => p.id === produtoId);
     if (produto) {
       setProdutoSelecionado(produtoId);
       setNovoEstoque(produto.estoqueAtual.toString());
       setDialogAjuste(true);
     }
   };

   const produtoHistorico = produtos.find(p => p.id === produtoSelecionado);
   const produtoAjuste = produtos.find(p => p.id === produtoSelecionado);

   return (
     <div className="container mx-auto px-4 py-6 space-y-6">
       {/* Header */}
       <div className="text-center space-y-2">
         <h1 className="text-3xl font-bold text-foreground">Controle de Estoque</h1>
         <p className="text-muted-foreground">Gestão de Produtos da Empresa</p>
       </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-card shadow-card border-border cursor-pointer hover:border-primary/50 transition-colors"
           onClick={() => setFiltro('todos')}>
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
                   placeholder="Ex: Produto X"
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

       {/* Relatório Simples */}
       <Card className="bg-card shadow-card border-border">
         <CardContent className="p-4">
           <div className="flex items-center gap-2 mb-3">
             <FileText className="h-5 w-5 text-primary" />
             <h3 className="font-semibold text-foreground">Resumo do Estoque</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
             <div>
               <p className="text-muted-foreground">Produtos cadastrados</p>
               <p className="font-bold text-foreground">{stats.total}</p>
             </div>
             <div>
               <p className="text-muted-foreground">Itens em estoque</p>
               <p className="font-bold text-foreground">{produtos.reduce((acc, p) => acc + p.estoqueAtual, 0)} un</p>
             </div>
             <div>
               <p className="text-muted-foreground">Valor total estimado</p>
               <p className="font-bold text-primary">R$ {produtos.reduce((acc, p) => acc + (p.preco * p.estoqueAtual), 0).toFixed(2)}</p>
             </div>
             <div>
               <p className="text-muted-foreground">Produtos em alerta</p>
               <p className="font-bold text-warning">{stats.emAlerta + stats.semEstoque}</p>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* Lista de Produtos */}
       {produtosFiltrados.length === 0 ? (
         <Card className="bg-card shadow-card border-border">
           <CardContent className="p-12 text-center">
             <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
             <h3 className="text-xl font-semibold text-foreground mb-2">
               {busca || filtro !== 'todos' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
             </h3>
             <p className="text-muted-foreground">
               {busca || filtro !== 'todos' ? 'Tente outro termo ou filtro' : 'Clique em "Adicionar Produto" para começar'}
             </p>
           </CardContent>
         </Card>
       ) : (
         <div className="space-y-2">
           {produtosFiltrados.map((produto) => {
             const estoqueAlerta = produto.estoqueAtual <= produto.estoqueMinimo;
             const estoqueZero = produto.estoqueAtual === 0;
             
             return (
               <Card key={produto.id} className={cn(
                 "bg-card shadow-card border-border",
                 estoqueZero && "border-destructive bg-destructive/5",
                 estoqueAlerta && !estoqueZero && "border-warning/50"
               )}>
                 <CardContent className="p-3">
                   <div className="flex items-center gap-3">
                     {/* Foto pequena */}
                     <div className={cn(
                       "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                       estoqueZero ? "bg-destructive/20" : "bg-products/20"
                     )}>
                       <ImageIcon className={cn(
                         "h-5 w-5",
                         estoqueZero ? "text-destructive" : "text-products"
                       )} />
                     </div>

                     {/* Info */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <h3 className="font-medium text-foreground truncate">{produto.nome}</h3>
                         {estoqueZero && (
                           <span className="px-1.5 py-0.5 text-xs rounded bg-destructive text-destructive-foreground">SEM ESTOQUE</span>
                         )}
                         {estoqueAlerta && !estoqueZero && (
                           <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                         )}
                       </div>
                       <p className="text-xs text-muted-foreground">Código: {produto.codigo}</p>
                     </div>

                     {/* Estoque */}
                     <div className="text-center px-3 min-w-[80px]">
                       <p className="text-xs text-muted-foreground">Atual</p>
                       <p className={cn(
                         "text-lg font-bold",
                         estoqueZero ? "text-destructive" : estoqueAlerta ? "text-warning" : "text-foreground"
                       )}>
                         {produto.estoqueAtual}
                       </p>
                     </div>

                     <div className="text-center px-3 min-w-[60px]">
                       <p className="text-xs text-muted-foreground">Min</p>
                       <p className="text-lg font-bold text-muted-foreground">
                         {produto.estoqueMinimo}
                       </p>
                     </div>

                     {/* Ações */}
                     <div className="flex gap-1">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => abrirMovimentacao(produto.id, 'entrada')}
                         className="border-success text-success hover:bg-success/10 h-8 px-2"
                       >
                         <ArrowUpCircle className="h-4 w-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => abrirMovimentacao(produto.id, 'saida')}
                         className="border-destructive text-destructive hover:bg-destructive/10 h-8 px-2"
                       >
                         <ArrowDownCircle className="h-4 w-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => abrirAjuste(produto.id)}
                         className="border-primary text-primary hover:bg-primary/10 h-8 px-2"
                       >
                         Ajuste
                       </Button>
                       <Button
                         size="icon"
                         variant="ghost"
                         onClick={() => abrirHistorico(produto.id)}
                         className="text-muted-foreground hover:text-foreground h-8 w-8"
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
                         className="text-destructive hover:bg-destructive/10 h-8 w-8"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
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

       {/* Dialog Ajuste Manual */}
       <Dialog open={dialogAjuste} onOpenChange={setDialogAjuste}>
         <DialogContent className="bg-card border-border">
           <DialogHeader>
             <DialogTitle className="text-primary">
               Ajuste Manual - {produtoAjuste?.nome}
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="p-4 rounded-xl bg-secondary/50 text-center">
               <p className="text-sm text-muted-foreground">Estoque Atual</p>
               <p className="text-2xl font-bold text-foreground">{produtoAjuste?.estoqueAtual} un</p>
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

 export default ControleEstoque;