# 📖 LEIAME DO CÓDIGO - Espaço Imperial

Este documento explica toda a estrutura do código para facilitar a manutenção e entendimento do projeto.

---

## 🚀 Como Rodar o Projeto no VS Code

### Pré-requisitos
1. **Node.js** (versão 18 ou superior) - [Download](https://nodejs.org/)
2. **VS Code** - [Download](https://code.visualstudio.com/)
3. **Git** (opcional, para clonar) - [Download](https://git-scm.com/)

### Passos para Rodar

1. **Abra a pasta do projeto no VS Code**
   ```bash
   code .
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   - Se usando Lovable Cloud: O arquivo `.env` já vem configurado
   - Se usando Supabase próprio: Copie `.env.example` para `.env` e preencha

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**
   - O projeto estará disponível em: `http://localhost:5173`

---

## 🔄 Migração para Supabase Próprio

Se você quer ter controle total do banco de dados:

### Arquivos de Migração

| Arquivo | Descrição |
|---------|-----------|
| `SCRIPT_MIGRACAO_COMPLETO.sql` | Script SQL com toda estrutura + dados |
| `.env.example` | Modelo das variáveis de ambiente |
| `CONFIGURACAO.md` | Guia detalhado de configuração |
| `HOSPEDAGEM.md` | Guia de hospedagem gratuita |

### Checklist de Migração

- [ ] Criar conta no [supabase.com](https://supabase.com)
- [ ] Criar novo projeto
- [ ] Executar `SCRIPT_MIGRACAO_COMPLETO.sql` no SQL Editor
- [ ] Copiar credenciais (URL e anon key)
- [ ] Copiar `.env.example` para `.env` e preencher
- [ ] Criar usuário admin (Authentication > Users)
- [ ] Adicionar role de admin (SQL: `INSERT INTO user_roles...`)
- [ ] Desativar "Confirm email" (opcional)
- [ ] Testar localmente: `npm run dev`
- [ ] Hospedar (ver `HOSPEDAGEM.md`)

---

## 📁 Estrutura de Pastas

```
projeto/
│
├── 📄 .env                    # Variáveis de ambiente
├── 📄 .env.example            # Modelo para Supabase próprio
├── 📄 LEIAME_CODIGO.md        # Este arquivo - guia principal
├── 📄 CONFIGURACAO.md         # Explicação das variáveis de ambiente
├── 📄 HOSPEDAGEM.md           # Guia de hospedagem gratuita
├── 📄 MANUTENCAO.md           # Guia de onde mexer para cada coisa
├── 📄 SCRIPT_MIGRACAO_COMPLETO.sql  # SQL para Supabase próprio
│
├── 📁 public/                 # Arquivos públicos estáticos
│   ├── favicon.ico            # Ícone da aba do navegador
│   └── robots.txt             # Configuração para mecanismos de busca
│
├── 📁 src/                    # CÓDIGO FONTE PRINCIPAL
│   │
│   ├── 📁 assets/             # Imagens e arquivos de mídia
│   │   ├── hero-burger.jpg    # Imagem do banner principal
│   │   ├── logo.png           # Logo da loja
│   │   └── logo-transparent.png # Logo com fundo transparente
│   │
│   ├── 📁 components/         # COMPONENTES VISUAIS REUTILIZÁVEIS
│   │   │
│   │   ├── 📁 admin/          # Componentes do painel administrativo
│   │   │   ├── CategoryEditModal.tsx    # Modal para editar categoria
│   │   │   ├── FirstAdminOnboarding.tsx # Tela de primeiro acesso admin
│   │   │   ├── OrdersPanel.tsx          # Painel de pedidos
│   │   │   ├── ProductEditModal.tsx     # Modal para editar produto
│   │   │   └── SettingsPanel.tsx        # Painel de configurações
│   │   │
│   │   ├── 📁 ui/             # Componentes base (botão, input, etc)
│   │   │   └── ... (shadcn/ui components)
│   │   │
│   │   ├── CartButton.tsx         # Botão flutuante do carrinho
│   │   ├── CategoryCard.tsx       # Card de categoria
│   │   ├── CategoryDropdown.tsx   # Dropdown de filtro por categoria
│   │   ├── Footer.tsx             # Rodapé do site
│   │   ├── Header.tsx             # Cabeçalho do site
│   │   ├── HeroBanner.tsx         # Banner principal da home
│   │   ├── NavLink.tsx            # Link de navegação
│   │   ├── OrderPreviewModal.tsx  # Modal de pré-visualização do pedido
│   │   ├── OrderSuccessModal.tsx  # Modal de sucesso após pedido
│   │   ├── ProductCard.tsx        # Card de produto (desktop)
│   │   ├── ProductDetailModal.tsx # Modal de detalhes do produto
│   │   ├── ProductListItem.tsx    # Item de produto (mobile)
│   │   ├── ScrollToTopButton.tsx  # Botão para voltar ao topo
│   │   └── WhatsAppFloatingButton.tsx # Botão flutuante do WhatsApp
│   │
│   ├── 📁 contexts/           # ESTADOS GLOBAIS (compartilhados em toda a app)
│   │   ├── AuthContext.tsx    # Estado de login/autenticação
│   │   └── CartContext.tsx    # Estado do carrinho de compras
│   │
│   ├── 📁 hooks/              # CONEXÃO COM O BANCO DE DADOS
│   │   ├── useCategories.ts   # Buscar/criar/editar categorias
│   │   ├── useOrders.ts       # Buscar/criar/atualizar pedidos
│   │   ├── useProducts.ts     # Buscar/criar/editar/deletar produtos
│   │   ├── useProductVariations.ts # Variações de produtos (tamanhos, etc)
│   │   ├── usePromotions.ts   # Promoções de produtos
│   │   └── useSettings.ts     # Configurações da loja
│   │
│   ├── 📁 integrations/       # INTEGRAÇÕES EXTERNAS
│   │   └── 📁 supabase/       # Configuração do banco de dados
│   │       ├── client.ts      # Cliente Supabase (NÃO EDITAR)
│   │       └── types.ts       # Tipos do banco (NÃO EDITAR)
│   │
│   ├── 📁 lib/                # FUNÇÕES UTILITÁRIAS
│   │   └── utils.ts           # Funções auxiliares (cn para classes CSS)
│   │
│   ├── 📁 pages/              # PÁGINAS DA APLICAÇÃO
│   │   ├── Admin.tsx          # Painel administrativo
│   │   ├── Auth.tsx           # Página de login
│   │   ├── Cart.tsx           # Carrinho de compras e checkout
│   │   ├── Index.tsx          # Página inicial (cardápio)
│   │   └── NotFound.tsx       # Página 404 (não encontrado)
│   │
│   ├── 📁 types/              # DEFINIÇÕES DE TIPOS DE DADOS
│   │   └── index.ts           # Tipos: Produto, Categoria, Pedido, etc
│   │
│   ├── App.tsx                # ARQUIVO PRINCIPAL - monta toda a aplicação
│   ├── App.css                # Estilos globais
│   ├── index.css              # Variáveis de cores e tema
│   ├── main.tsx               # Ponto de entrada da aplicação
│   └── vite-env.d.ts          # Tipos do Vite
│
├── 📁 supabase/               # CONFIGURAÇÃO DO BACKEND
│   ├── config.toml            # Configuração do Supabase (NÃO EDITAR)
│   └── 📁 functions/          # Funções serverless
│       └── bootstrap-admin/   # Função para criar primeiro admin
│
├── 📄 tailwind.config.ts      # Configuração de cores e tema
├── 📄 vite.config.ts          # Configuração do bundler
└── 📄 package.json            # Dependências do projeto
```

---

## 🔧 Tecnologias Utilizadas

| Tecnologia | Descrição | Para que serve |
|------------|-----------|----------------|
| **React** | Biblioteca de interface | Criar os componentes visuais |
| **TypeScript** | JavaScript com tipos | Evitar erros no código |
| **Tailwind CSS** | Framework de estilos | Estilizar a aplicação |
| **Vite** | Bundler/servidor | Rodar e compilar o projeto |
| **Supabase** | Backend-as-a-Service | Banco de dados e autenticação |
| **TanStack Query** | Gerenciador de dados | Cache e sincronização com banco |
| **React Router** | Roteamento | Navegar entre páginas |
| **Lucide React** | Ícones | Ícones bonitos e modernos |
| **Sonner** | Notificações | Mostrar toasts/alertas |

---

## 🌐 Rotas da Aplicação

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Index.tsx | Página inicial com cardápio |
| `/cart` | Cart.tsx | Carrinho de compras e checkout |
| `/auth` | Auth.tsx | Login/cadastro |
| `/admin` | Admin.tsx | Painel administrativo (requer login) |
| `*` | NotFound.tsx | Qualquer outra rota (erro 404) |

---

## 📊 Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Páginas   │────▶│    Hooks    │────▶│  Supabase   │
│  (Index,    │     │ (useProducts│     │  (Banco de  │
│   Cart...)  │◀────│  useOrders) │◀────│   Dados)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ usa
       ▼
┌─────────────┐
│  Contexts   │
│ (Carrinho,  │
│   Auth)     │
└─────────────┘
```

1. **Páginas** exibem a interface e interagem com o usuário
2. **Hooks** fazem a comunicação com o banco de dados
3. **Contexts** guardam estados compartilhados (carrinho, usuário logado)
4. **Supabase** armazena todos os dados persistentes

---

## 📝 Convenções do Código

- **Arquivos de componente**: PascalCase (ex: `ProductCard.tsx`)
- **Arquivos de hook**: camelCase com prefixo "use" (ex: `useProducts.ts`)
- **Variáveis e funções**: camelCase (ex: `handleSubmit`)
- **Tipos/Interfaces**: PascalCase (ex: `Product`, `CartItem`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `STORAGE_KEY`)

---

## 🔗 Links Úteis

- **Documentação React**: https://react.dev/
- **Documentação Tailwind**: https://tailwindcss.com/docs
- **Documentação Supabase**: https://supabase.com/docs
- **Ícones Lucide**: https://lucide.dev/icons/

---

## ❓ Dúvidas Frequentes

### Como adicionar um novo produto pelo código?
Use o hook `useCreateProduct()` do arquivo `src/hooks/useProducts.ts`.

### Como mudar as cores do site?
Edite o arquivo `src/index.css` e `tailwind.config.ts`.

### Como ver os dados do banco?
- **Lovable Cloud**: Use as ferramentas do Lovable
- **Supabase próprio**: Acesse o dashboard do Supabase

### Onde ficam as configurações da loja?
No banco de dados, tabela `settings`. Acesse pelo painel admin > Configurações.

### Como hospedar o cardápio?
Veja o arquivo `HOSPEDAGEM.md` para instruções detalhadas de hospedagem gratuita.
