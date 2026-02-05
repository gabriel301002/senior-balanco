 import { useSystemContext } from '@/contexts/SystemContext';
 import { Button } from '@/components/ui/button';
 import { ShoppingCart, Warehouse, X } from 'lucide-react';
 import { cn } from '@/lib/utils';

 const SystemSwitcher = () => {
   const { mode, setMode, menuOpen, setMenuOpen } = useSystemContext();

   if (!menuOpen) return null;

   return (
     <>
       {/* Overlay */}
       <div 
         className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
         onClick={() => setMenuOpen(false)}
       />
       
       {/* Menu Central */}
       <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
         <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
           {/* Header */}
           <div className="flex items-center justify-between p-4 border-b border-border">
             <h2 className="text-xl font-bold text-foreground">Selecionar Sistema</h2>
             <Button
               variant="ghost"
               size="icon"
               onClick={() => setMenuOpen(false)}
               className="text-muted-foreground hover:text-foreground"
             >
               <X className="h-5 w-5" />
             </Button>
           </div>

           {/* Options */}
           <div className="p-4 space-y-3">
             {/* Cantina Option */}
             <button
               onClick={() => {
                 setMode('cantina');
                 setMenuOpen(false);
               }}
               className={cn(
                 "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left",
                 mode === 'cantina'
                   ? "border-primary bg-primary/10"
                   : "border-border hover:border-primary/50 hover:bg-secondary"
               )}
             >
               <div className={cn(
                 "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                 mode === 'cantina' ? "bg-primary" : "bg-secondary"
               )}>
                 <ShoppingCart className={cn(
                   "h-7 w-7",
                   mode === 'cantina' ? "text-primary-foreground" : "text-muted-foreground"
                 )} />
               </div>
               <div>
                 <h3 className="font-bold text-foreground text-lg">Cantina</h3>
                 <p className="text-sm text-muted-foreground">
                   Gestão de clientes, saldos e vendas
                 </p>
               </div>
             </button>

             {/* Estoque Option */}
             <button
               onClick={() => {
                 setMode('estoque');
                 setMenuOpen(false);
               }}
               className={cn(
                 "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left",
                 mode === 'estoque'
                   ? "border-products bg-products/10"
                   : "border-border hover:border-products/50 hover:bg-secondary"
               )}
             >
               <div className={cn(
                 "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                 mode === 'estoque' ? "bg-products" : "bg-secondary"
               )}>
                 <Warehouse className={cn(
                   "h-7 w-7",
                   mode === 'estoque' ? "text-products-foreground" : "text-muted-foreground"
                 )} />
               </div>
               <div>
                 <h3 className="font-bold text-foreground text-lg">Controle de Estoque</h3>
                 <p className="text-sm text-muted-foreground">
                   Entrada, saída e relatórios de produtos
                 </p>
               </div>
             </button>
           </div>

           {/* Footer */}
           <div className="p-4 border-t border-border">
             <p className="text-xs text-center text-muted-foreground">
               Clique no ícone no canto superior esquerdo para trocar de sistema a qualquer momento
             </p>
           </div>
         </div>
       </div>
     </>
   );
 };

 export default SystemSwitcher;