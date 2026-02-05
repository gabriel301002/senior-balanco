 import React, { createContext, useContext, useState, ReactNode } from 'react';

 type SystemMode = 'cantina' | 'estoque';

 interface SystemContextType {
   mode: SystemMode;
   setMode: (mode: SystemMode) => void;
   menuOpen: boolean;
   setMenuOpen: (open: boolean) => void;
   toggleMenu: () => void;
 }

 const SystemContext = createContext<SystemContextType | undefined>(undefined);

 export const useSystemContext = () => {
   const context = useContext(SystemContext);
   if (!context) {
     throw new Error('useSystemContext must be used within a SystemProvider');
   }
   return context;
 };

 export const SystemProvider = ({ children }: { children: ReactNode }) => {
   const [mode, setMode] = useState<SystemMode>('cantina');
   const [menuOpen, setMenuOpen] = useState(false);

   const toggleMenu = () => setMenuOpen(prev => !prev);

   return (
     <SystemContext.Provider value={{ mode, setMode, menuOpen, setMenuOpen, toggleMenu }}>
       {children}
     </SystemContext.Provider>
   );
 };