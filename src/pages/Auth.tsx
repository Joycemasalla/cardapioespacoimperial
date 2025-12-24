import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/admin');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    
    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success('Conta criada! Você já pode fazer login.');
      setIsLogin(true);
    }
    setLoading(false);
  };

  if (isLoading) return <div className="min-h-screen bg-background dark flex items-center justify-center"><div className="animate-pulse">Carregando...</div></div>;

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Crown className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold mt-4">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-2">{isLogin ? 'Faça login para continuar' : 'Crie sua conta'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border border-border">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}</Button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">{isLogin ? 'Criar conta' : 'Fazer login'}</button>
        </p>
      </div>
    </div>
  );
}
