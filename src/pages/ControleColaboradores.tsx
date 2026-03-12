import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseLancamentos, LancamentoColaborador, ColaboradorControle } from '@/hooks/useSupabaseLancamentos';
import { Plus, ArrowLeft, Search, UserCog, AlertTriangle, Calendar, Umbrella, Briefcase, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const tipoLabels: Record<string, string> = {
  falta_justificada: 'Falta Justificada',
  falta_nao_justificada: 'Falta Não Justificada',
  folga: 'Folga',
  plantao_extra: 'Plantão Extra',
};

const tipoIcons: Record<string, any> = {
  falta_justificada: AlertTriangle,
  falta_nao_justificada: AlertTriangle,
  folga: Umbrella,
  plantao_extra: Briefcase,
};

const tipoColors: Record<string, string> = {
  falta_justificada: 'bg-warning/20 text-warning',
  falta_nao_justificada: 'bg-destructive/20 text-destructive',
  folga: 'bg-primary/20 text-primary',
  plantao_extra: 'bg-success/20 text-success',
};

const ControleColaboradores = () => {
  const { colaboradores, loading, adicionarLancamento, removerLancamento, fetchData } = useSupabaseLancamentos();
  const [busca, setBusca] = useState('');
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<ColaboradorControle | null>(null);
  const [dialogLancamento, setDialogLancamento] = useState(false);
  const [dialogCadastro, setDialogCadastro] = useState(false);
  const [mesFiltro, setMesFiltro] = useState(new Date().getMonth());
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());

  // Form state - lançamento
  const [tipoLancamento, setTipoLancamento] = useState<LancamentoColaborador['tipo'] | ''>('');
  const [dataLancamento, setDataLancamento] = useState('');
  const [atestado, setAtestado] = useState(false);
  const [observacao, setObservacao] = useState('');

  // Form state - cadastro
  const [novoNome, setNovoNome] = useState('');
  const [novoCargo, setNovoCargo] = useState('');

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const colabsFiltrados = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) && c.status === 'ativo'
  );

  const resetForm = () => {
    setTipoLancamento('');
    setDataLancamento('');
    setAtestado(false);
    setObservacao('');
  };

  const resetCadastroForm = () => {
    setNovoNome('');
    setNovoCargo('');
  };

  const handleCadastrarColaborador = async () => {
    if (!novoNome.trim() || !novoCargo.trim()) {
      toast.error('Preencha nome e cargo');
      return;
    }
    await supabase.from('colaboradores').insert({ nome: novoNome.trim(), cargo: novoCargo.trim() });
    toast.success('Colaborador cadastrado!');
    resetCadastroForm();
    setDialogCadastro(false);
    await fetchData();
  };

  const handleRemoverColaborador = async (id: string) => {
    await supabase.from('lancamentos_colaborador').delete().eq('colaborador_id', id);
    await supabase.from('movimentacoes_colaborador').delete().eq('colaborador_id', id);
    await supabase.from('colaboradores').delete().eq('id', id);
    toast.success('Colaborador removido!');
    await fetchData();
  };

  const handleSalvarLancamento = async () => {
    if (!tipoLancamento || !dataLancamento || !colaboradorSelecionado) {
      toast.error('Preencha tipo e data');
      return;
    }
    await adicionarLancamento(colaboradorSelecionado.id, tipoLancamento, dataLancamento, atestado, observacao);
    toast.success('Lançamento salvo!');
    resetForm();
    setDialogLancamento(false);
  };

  const handleRemoverLancamento = async (id: string) => {
    await removerLancamento(id);
    toast.success('Lançamento removido');
  };

  const getLancamentosMes = (colab: ColaboradorControle) => {
    return colab.lancamentos.filter(l => {
      const d = new Date(l.data + 'T00:00:00');
      return d.getMonth() === mesFiltro && d.getFullYear() === anoFiltro;
    });
  };

  const colabAtual = colaboradorSelecionado
    ? colaboradores.find(c => c.id === colaboradorSelecionado.id) || colaboradorSelecionado
    : null;

  const lancamentosMes = colabAtual ? getLancamentosMes(colabAtual) : [];

  const resumo = {
    faltasJustificadas: lancamentosMes.filter(l => l.tipo === 'falta_justificada').length,
    faltasNaoJustificadas: lancamentosMes.filter(l => l.tipo === 'falta_nao_justificada').length,
    folgas: lancamentosMes.filter(l => l.tipo === 'folga').length,
    plantoesExtras: lancamentosMes.filter(l => l.tipo === 'plantao_extra').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Detail view
  if (colabAtual) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setColaboradorSelecionado(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{colabAtual.nome}</h1>
            <p className="text-muted-foreground">{colabAtual.cargo}</p>
          </div>
        </div>

        {/* Month filter */}
        <div className="flex gap-3">
          <Select value={mesFiltro.toString()} onValueChange={v => setMesFiltro(parseInt(v))}>
            <SelectTrigger className="w-[140px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {meses.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={anoFiltro.toString()} onValueChange={v => setAnoFiltro(parseInt(v))}>
            <SelectTrigger className="w-[100px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faltas Justificadas</p>
                <p className="text-2xl font-bold text-foreground">{resumo.faltasJustificadas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faltas Não Justif.</p>
                <p className="text-2xl font-bold text-foreground">{resumo.faltasNaoJustificadas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Umbrella className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Folgas</p>
                <p className="text-2xl font-bold text-foreground">{resumo.folgas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Briefcase className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plantões Extras</p>
                <p className="text-2xl font-bold text-foreground">{resumo.plantoesExtras}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New launch button + Dialog */}
        <Dialog open={dialogLancamento} onOpenChange={(o) => { setDialogLancamento(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Tipo de Lançamento</Label>
                <Select value={tipoLancamento} onValueChange={v => setTipoLancamento(v as LancamentoColaborador['tipo'])}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                    <SelectItem value="falta_nao_justificada">Falta Não Justificada</SelectItem>
                    <SelectItem value="folga">Folga</SelectItem>
                    <SelectItem value="plantao_extra">Plantão Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground">Data</Label>
                <Input type="date" value={dataLancamento} onChange={e => setDataLancamento(e.target.value)} className="bg-secondary border-border" />
              </div>
              {(tipoLancamento === 'falta_justificada' || tipoLancamento === 'falta_nao_justificada') && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={atestado} onCheckedChange={v => setAtestado(!!v)} />
                  <Label className="text-foreground">Possui atestado?</Label>
                </div>
              )}
              <div>
                <Label className="text-foreground">Observação (opcional)</Label>
                <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observação..." className="bg-secondary border-border" />
              </div>
              <Button onClick={handleSalvarLancamento} className="w-full">Salvar Lançamento</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Launches table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lançamentos - {meses[mesFiltro]}/{anoFiltro}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lancamentosMes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum lançamento neste período</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Atestado</TableHead>
                    <TableHead>Obs</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentosMes.map(l => {
                    const Icon = tipoIcons[l.tipo] || Calendar;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-foreground">
                          {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', tipoColors[l.tipo])}>
                            <Icon className="h-3 w-3" />
                            {tipoLabels[l.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {(l.tipo === 'falta_justificada' || l.tipo === 'falta_nao_justificada') ? (l.atestado ? 'Sim' : 'Não') : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[250px]">
                          {l.observacao ? (
                            <details className="cursor-pointer">
                              <summary className="truncate max-w-[150px]">{l.observacao}</summary>
                              <p className="mt-1 whitespace-pre-wrap text-foreground bg-secondary/50 rounded p-2 text-xs">{l.observacao}</p>
                            </details>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoverLancamento(l.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Colaboradores</h1>
          <p className="text-muted-foreground">Unidade Senior – Faltas, Folgas e Plantões</p>
        </div>
        {/* Cadastrar Colaborador */}
        <Dialog open={dialogCadastro} onOpenChange={(o) => { setDialogCadastro(o); if (!o) resetCadastroForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" /> Cadastrar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Cadastrar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Nome Completo</Label>
                <Input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do colaborador" className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-foreground">Cargo</Label>
                <Input value={novoCargo} onChange={e => setNovoCargo(e.target.value)} placeholder="Ex: Cozinheiro, Auxiliar..." className="bg-secondary border-border" />
              </div>
              <Button onClick={handleCadastrarColaborador} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" /> Salvar Colaborador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar colaborador..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {colabsFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum colaborador encontrado</p>
          </div>
        ) : (
          colabsFiltrados.map(colab => {
            const lancsMes = getLancamentosMes(colab);
            const faltas = lancsMes.filter(l => l.tipo.startsWith('falta')).length;
            const plantoes = lancsMes.filter(l => l.tipo === 'plantao_extra').length;
            return (
              <Card
                key={colab.id}
                className="bg-card border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => setColaboradorSelecionado(colab)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">{colab.nome.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{colab.nome}</h3>
                      <p className="text-sm text-muted-foreground">{colab.cargo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {faltas > 0 && (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        {faltas} falta(s)
                      </Badge>
                    )}
                    {plantoes > 0 && (
                      <Badge variant="outline" className="text-success border-success/30">
                        {plantoes} plantão(ões)
                      </Badge>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={e => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Remover Colaborador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{colab.nome}</strong>? Todos os lançamentos serão apagados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoverColaborador(colab.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ControleColaboradores;
