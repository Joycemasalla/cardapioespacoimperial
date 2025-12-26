import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

export default function TermsOfService() {
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
          <h1 className="text-xl font-display font-semibold text-foreground">Termos de Uso</h1>
        </div>
      </header>

      <div className="container py-8 max-w-3xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-foreground/90">
              Ao utilizar o site e realizar pedidos no {storeName}, você concorda com estes 
              Termos de Uso. Se não concordar, por favor, não utilize nossos serviços.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Serviços</h2>
            <p className="text-foreground/90">
              O {storeName} oferece um cardápio digital para visualização de produtos e 
              realização de pedidos via WhatsApp. Os pedidos são processados conforme 
              disponibilidade e horário de funcionamento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Pedidos</h2>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li>Os pedidos são enviados via WhatsApp e devem ser confirmados pela equipe</li>
              <li>Preços e disponibilidade podem sofrer alterações sem aviso prévio</li>
              <li>O tempo de entrega é uma estimativa e pode variar conforme demanda</li>
              <li>Reservamo-nos o direito de recusar pedidos em casos excepcionais</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Pagamentos</h2>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li>Aceitamos PIX, dinheiro e cartão (débito/crédito)</li>
              <li>Para pagamento via PIX, o comprovante deve ser enviado junto ao pedido</li>
              <li>O pedido será preparado após confirmação do pagamento ou na entrega</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Entrega</h2>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li>A taxa de entrega é calculada conforme a localização</li>
              <li>Áreas de entrega podem ser limitadas</li>
              <li>O cliente deve fornecer endereço completo e correto</li>
              <li>O cliente deve estar disponível para receber o pedido</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Cancelamentos</h2>
            <p className="text-foreground/90">
              Cancelamentos devem ser solicitados via WhatsApp antes do início do preparo. 
              Pedidos já em preparo não podem ser cancelados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Responsabilidades</h2>
            <p className="text-foreground/90">
              O {storeName} não se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-foreground/90 space-y-2">
              <li>Atrasos causados por fatores externos (trânsito, clima, etc.)</li>
              <li>Informações incorretas fornecidas pelo cliente</li>
              <li>Indisponibilidade temporária do site ou WhatsApp</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Propriedade Intelectual</h2>
            <p className="text-foreground/90">
              Todo o conteúdo do site (imagens, textos, logos) é de propriedade do {storeName} 
              e não pode ser reproduzido sem autorização.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Contato</h2>
            <p className="text-foreground/90">
              Para dúvidas sobre estes termos, entre em contato pelo WhatsApp:{' '}
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
            <h2 className="text-xl font-semibold text-foreground">10. Alterações</h2>
            <p className="text-foreground/90">
              Estes termos podem ser atualizados a qualquer momento. O uso continuado do 
              serviço após alterações implica aceitação dos novos termos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
