import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Users, Package, UserCog, LayoutDashboard, LogOut, Menu, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSystemContext } from '@/contexts/SystemContext';
import SystemSwitcher from '@/components/SystemSwitcher';
import EstoqueMantimentos from '@/pages/EstoqueMantimentos';
import { useAuth } from '@/hooks/useAuth';

const navItemsCantina = [
  { path: '/dashboard/clientes', label: 'Clientes', icon: Users, color: 'text-clients' },
  { path: '/dashboard/produtos', label: 'Produtos', icon: Package, color: 'text-products' },
  { path: '/dashboard/colaboradores', label: 'Colaboradores', icon: UserCog, color: 'text-collaborators' },
  { path: '/dashboard/geral', label: 'Geral', icon: LayoutDashboard, color: 'text-primary' },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleMenu } = useSystemContext();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Redirecionar para clientes se estiver na raiz do dashboard
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/clientes');
    }
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast.success('Sessão encerrada');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se estiver no modo mantimentos
  if (mode === 'mantimentos') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-collaborators/10 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="text-foreground hover:bg-collaborators/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-collaborators/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-collaborators" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Estoque Mantimentos</h1>
                <p className="text-xs text-muted-foreground">Insumos da Empresa</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 pt-16">
          <EstoqueMantimentos />
        </main>

        <SystemSwitcher />
      </div>
    );
  }

  // Layout Cantina (original)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-foreground hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Sênior Cantina</h1>
              <p className="text-xs text-muted-foreground">Passo a Passo</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItemsCantina.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all",
                    isActive 
                      ? "bg-primary/10" 
                      : "hover:bg-accent"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? item.color : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* System Switcher Modal */}
      <SystemSwitcher />
    </div>
  );
};

export default MainLayout;
