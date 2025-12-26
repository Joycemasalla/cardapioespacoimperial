import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

export default function PrivacyPolicy() {
  const { data: settings } = useSettings();
  const storeName = settings?.store_name || 'Espaço Imperial';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="container py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-xl font-display font-semibold text-foreground">Política de Privacidade</h1>
        </div>
      </header>

      <div className="container py-8 max-w-3xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p className="text-foreground/90">
              O {storeName} está comprometido em proteger a privacidade dos dados pessoais de seus clientes, 
              em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Dados Coletados</h2>
            <p className="text-foreground/90">Coletamos apenas os dados necessários para processar seu pedido:</p>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li><strong>Nome:</strong> Para identificação do pedido</li>
              <li><strong>Telefone/WhatsApp:</strong> Para comunicação sobre o pedido (opcional)</li>
              <li><strong>Endereço:</strong> Para entrega (quando aplicável)</li>
              <li><strong>Itens do pedido:</strong> Produtos selecionados e preferências</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Uso</h2>
            <p className="text-foreground/90">Seus dados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li>Processar e entregar seu pedido</li>
              <li>Comunicar sobre status do pedido</li>
              <li>Entrar em contato em caso de dúvidas sobre o pedido</li>
              <li>Melhorar nossos serviços (dados anonimizados)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Armazenamento Local</h2>
            <p className="text-foreground/90">
              Para sua conveniência, armazenamos seus dados de contato (nome, telefone e endereço) 
              localmente no seu navegador (localStorage). Isso permite que você não precise 
              preencher os dados novamente em pedidos futuros. Você pode limpar esses dados 
              a qualquer momento limpando os dados do navegador.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p className="text-foreground/90">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, 
              exceto quando necessário para a entrega do pedido ou quando exigido por lei.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Seus Direitos (LGPD)</h2>
            <p className="text-foreground/90">Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li><strong>Acesso:</strong> Solicitar informações sobre seus dados armazenados</li>
              <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
              <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Segurança</h2>
            <p className="text-foreground/90">
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Contato</h2>
            <p className="text-foreground/90">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
              entre em contato pelo WhatsApp:{' '}
              <a 
                href={`https://wa.me/${settings?.whatsapp_number || '5511999999999'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {settings?.whatsapp_number || '(11) 99999-9999'}
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Alterações</h2>
            <p className="text-foreground/90">
              Esta política pode ser atualizada periodicamente. Recomendamos que você 
              revise esta página regularmente para estar ciente de quaisquer alterações.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
