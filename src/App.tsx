/**
 * ========================================
 * ARQUIVO: App.tsx
 * ========================================
 * 
 * Este é o ARQUIVO PRINCIPAL da aplicação.
 * Ele monta toda a estrutura e conecta:
 * - Rotas (páginas)
 * - Providers (estados globais)
 * - Componentes de UI (toasts, tooltips)
 * 
 * ESTRUTURA DE PROVIDERS (de fora para dentro):
 * 1. QueryClientProvider - Gerenciamento de cache de dados
 * 2. AuthProvider - Estado de login/usuário
 * 3. CartProvider - Estado do carrinho de compras
 * 4. TooltipProvider - Tooltips do shadcn/ui
 * 
 * ROTAS DISPONÍVEIS:
 * - "/" → Página inicial (cardápio)
 * - "/cart" → Carrinho de compras
 * - "/auth" → Login/cadastro
 * - "/admin" → Painel administrativo
 * - "*" → Página 404 (não encontrado)
 * 
 * ========================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Cliente do TanStack Query para gerenciamento de cache
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          {/* Componentes de notificação (toast) */}
          <Toaster />
          <Sonner />
          
          {/* Sistema de rotas */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
