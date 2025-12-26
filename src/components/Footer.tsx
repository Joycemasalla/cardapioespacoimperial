import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-6 mt-auto">
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          {/* LGPD Links */}
          <div className="flex items-center gap-4 text-sm">
            <Link 
              to="/privacidade" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link 
              to="/termos" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
          
          {/* Copyright */}
          <p className="text-muted-foreground text-sm text-center">
            © 2025 Espaço Imperial - Desenvolvido por Joyce Masalla
          </p>
        </div>
      </div>
    </footer>
  );
}