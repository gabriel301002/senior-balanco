import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const DASHBOARD_PASSWORD = 'ilpi301002';

interface DashboardPasswordGateProps {
  children: ReactNode;
}

const DashboardPasswordGate = ({ children }: DashboardPasswordGateProps) => {
  const [senha, setSenha] = useState('');
  const [liberado, setLiberado] = useState(() => {
    return sessionStorage.getItem('dashboard_geral_liberado') === 'true';
  });

  const verificarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha === DASHBOARD_PASSWORD) {
      setLiberado(true);
      sessionStorage.setItem('dashboard_geral_liberado', 'true');
      toast.success('Acesso liberado!');
    } else {
      toast.error('Senha incorreta');
      setSenha('');
    }
  };

  if (liberado) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Área Restrita</h2>
          <p className="text-muted-foreground">
            Digite a senha para acessar o Dashboard Geral
          </p>
        </div>

        <form onSubmit={verificarSenha} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha-dashboard" className="text-foreground">Senha de Acesso</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="senha-dashboard"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-10 h-12 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                autoFocus
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Liberar Acesso
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DashboardPasswordGate;
