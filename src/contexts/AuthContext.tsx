/**
 * ========================================
 * CONTEXTO: AuthContext (Autenticação)
 * ========================================
 * 
 * Gerencia o estado de login/autenticação do usuário.
 * Conecta com o Supabase Auth para:
 * - Login com email/senha
 * - Cadastro de novos usuários
 * - Verificação de permissões de admin
 * - Logout
 * 
 * FUNCIONALIDADES:
 * - user: Dados do usuário logado (ou null)
 * - session: Sessão ativa
 * - isAdmin: Se o usuário é administrador
 * - isLoading: Se está carregando dados
 * - signIn: Fazer login
 * - signUp: Criar conta
 * - signOut: Sair
 * 
 * COMO USAR:
 * ```typescript
 * import { useAuth } from '@/contexts/AuthContext';
 * 
 * function MeuComponente() {
 *   const { user, isAdmin, signOut } = useAuth();
 *   // ...
 * }
 * ```
 * 
 * ========================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Tipos do contexto
interface AuthContextType {
  user: User | null;                    // Usuário logado
  session: Session | null;              // Sessão ativa
  isAdmin: boolean;                     // Se é administrador
  isLoading: boolean;                   // Se está carregando
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// Contexto React
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de Autenticação
 * Envolve a aplicação e fornece o estado de login
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Efeito inicial: monitora mudanças de autenticação
   */
  useEffect(() => {
    // Listener para mudanças de auth (login, logout, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Se tem usuário, verifica se é admin
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Busca sessão atual (se já estiver logado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      setIsLoading(false);
    });

    // Cleanup: remove listener ao desmontar
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Verifica se o usuário tem role de admin
   * Busca na tabela user_roles
   */
  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  /**
   * Faz login com email e senha
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  /**
   * Cria nova conta
   * O fullName é salvo nos metadados do usuário
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  /**
   * Faz logout
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar autenticação
 * Deve ser usado dentro de um AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
