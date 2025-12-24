# 🛠️ GUIA DE MANUTENÇÃO

Este documento indica exatamente onde mexer no código para cada tipo de alteração.

---

## 📍 Onde Mexer Para...

### 🍔 Alterar Produtos (preços, descrições, imagens)

**Opção 1 - Pelo Painel Admin (mais fácil):**
- Acesse `/admin`
- Vá na aba "Produtos"
- Clique no ícone de edição (lápis)

**Opção 2 - Pelo Código:**
- **Hook de dados**: `src/hooks/useProducts.ts`
- **Modal de edição**: `src/components/admin/ProductEditModal.tsx`
- **Card do produto**: `src/components/ProductCard.tsx`
- **Item de lista mobile**: `src/components/ProductListItem.tsx`

---

### 📂 Alterar Categorias

**Pelo Painel Admin:**
- Acesse `/admin`
- Vá na aba "Categorias"

**Pelo Código:**
- **Hook de dados**: `src/hooks/useCategories.ts`
- **Modal de edição**: `src/components/admin/CategoryEditModal.tsx`

---

### 🎨 Alterar Cores e Tema Visual

**Arquivos principais:**

1. **`src/index.css`** - Variáveis CSS do tema
   ```css
   :root {
     --primary: 45 100% 50%;        /* Cor principal (dourado) */
     --background: 0 0% 7%;         /* Fundo escuro */
     --foreground: 0 0% 95%;        /* Texto claro */
     /* ... outras variáveis */
   }
   ```

2. **`tailwind.config.ts`** - Extensões do Tailwind
   ```typescript
   theme: {
     extend: {
       colors: {
         primary: "hsl(var(--primary))",
         // ...
       }
     }
   }
   ```

---

### 📱 Alterar Layout do Cardápio

**Página principal:**
- `src/pages/Index.tsx`

**Componentes relacionados:**
- **Banner**: `src/components/HeroBanner.tsx`
- **Card de produto (desktop)**: `src/components/ProductCard.tsx`
- **Lista de produto (mobile)**: `src/components/ProductListItem.tsx`
- **Filtro de categoria**: `src/components/CategoryDropdown.tsx`
- **Cabeçalho**: `src/components/Header.tsx`
- **Rodapé**: `src/components/Footer.tsx`

---

### 🛒 Alterar Carrinho e Checkout

**Página do carrinho:**
- `src/pages/Cart.tsx`

**Contexto do carrinho (lógica de adicionar/remover):**
- `src/contexts/CartContext.tsx`

**Modais relacionados:**
- **Preview do pedido**: `src/components/OrderPreviewModal.tsx`
- **Sucesso do pedido**: `src/components/OrderSuccessModal.tsx`
- **Detalhes do produto**: `src/components/ProductDetailModal.tsx`

---

### ⚙️ Alterar Configurações da Loja

**Pelo Painel Admin:**
- Acesse `/admin`
- Vá na aba "Configurações"

**Pelo Código:**
- **Hook de dados**: `src/hooks/useSettings.ts`
- **Painel de configurações**: `src/components/admin/SettingsPanel.tsx`

**Configurações disponíveis:**
- Nome da loja
- Número do WhatsApp
- Taxa de entrega
- Chave PIX
- Status (aberto/fechado)
- Endereço da loja

---

### 🔐 Alterar Login/Autenticação

**Página de login:**
- `src/pages/Auth.tsx`

**Contexto de autenticação:**
- `src/contexts/AuthContext.tsx`

**Verificação de admin:**
- A verificação é feita buscando na tabela `user_roles`
- Para dar permissão de admin, insira um registro com `role = 'admin'`

---

### 📦 Adicionar Nova Página

1. **Crie o arquivo** em `src/pages/NovaPagina.tsx`

2. **Adicione a rota** em `src/App.tsx`:
   ```typescript
   import NovaPagina from './pages/NovaPagina';
   
   // Dentro de <Routes>:
   <Route path="/nova-pagina" element={<NovaPagina />} />
   ```

---

### 🧩 Adicionar Novo Componente

1. **Crie o arquivo** em `src/components/MeuComponente.tsx`

2. **Estrutura básica**:
   ```typescript
   /**
    * ========================================
    * COMPONENTE: MeuComponente
    * ========================================
    * Descrição do que o componente faz
    * ========================================
    */
   
   interface MeuComponenteProps {
     titulo: string;
   }
   
   export function MeuComponente({ titulo }: MeuComponenteProps) {
     return (
       <div>
         <h1>{titulo}</h1>
       </div>
     );
   }
   ```

3. **Use em outra página/componente**:
   ```typescript
   import { MeuComponente } from '@/components/MeuComponente';
   
   // ...
   <MeuComponente titulo="Olá mundo" />
   ```

---

### 🔗 Adicionar Novo Hook (conexão com banco)

1. **Crie o arquivo** em `src/hooks/useMinhaNovaDado.ts`

2. **Estrutura básica**:
   ```typescript
   /**
    * ========================================
    * HOOK: useMinhaNovaDado
    * ========================================
    * Descrição do que o hook faz
    * 
    * TABELA NO BANCO: nome_da_tabela
    * ========================================
    */
   
   import { useQuery } from '@tanstack/react-query';
   import { supabase } from '@/integrations/supabase/client';
   
   export function useMinhaNovaDado() {
     return useQuery({
       queryKey: ['minha-chave'],
       queryFn: async () => {
         const { data, error } = await supabase
           .from('nome_da_tabela')
           .select('*');
         
         if (error) throw error;
         return data;
       },
     });
   }
   ```

---

## 📊 Estrutura do Banco de Dados

### Tabela: `products`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do produto |
| price | NUMERIC | Preço em reais |
| description | TEXT | Descrição (opcional) |
| image_url | TEXT | URL da imagem (opcional) |
| category_id | UUID | ID da categoria |
| is_active | BOOLEAN | Se está visível no cardápio |
| is_featured | BOOLEAN | Se é destaque |
| created_at | TIMESTAMP | Data de criação |

### Tabela: `categories`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome da categoria |
| description | TEXT | Descrição (opcional) |
| image_url | TEXT | URL da imagem (opcional) |
| sort_order | INTEGER | Ordem de exibição |
| is_active | BOOLEAN | Se está visível |
| created_at | TIMESTAMP | Data de criação |

### Tabela: `orders`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| customer_name | TEXT | Nome do cliente |
| customer_phone | TEXT | WhatsApp do cliente |
| order_type | ENUM | 'delivery', 'pickup' ou 'table' |
| table_number | INTEGER | Número da mesa (opcional) |
| address | TEXT | Endereço de entrega (opcional) |
| address_complement | TEXT | Complemento (opcional) |
| items | JSONB | Lista de itens do pedido |
| total | NUMERIC | Valor total |
| status | ENUM | Status do pedido |
| notes | TEXT | Observações (opcional) |
| created_at | TIMESTAMP | Data/hora do pedido |

### Tabela: `settings`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| whatsapp_number | TEXT | Número do WhatsApp da loja |
| store_name | TEXT | Nome da loja |
| store_address | TEXT | Endereço físico (opcional) |
| delivery_fee | NUMERIC | Taxa de entrega |
| is_open | BOOLEAN | Se a loja está aberta |
| pix_key | TEXT | Chave PIX (opcional) |
| updated_at | TIMESTAMP | Última atualização |

### Tabela: `promotions`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| product_id | UUID | ID do produto |
| discount_percent | INTEGER | Porcentagem de desconto |
| starts_at | TIMESTAMP | Início da promoção |
| ends_at | TIMESTAMP | Fim da promoção (opcional) |
| is_active | BOOLEAN | Se está ativa |

### Tabela: `product_variations`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| product_id | UUID | ID do produto |
| name | TEXT | Nome da variação (ex: "Grande") |
| price | NUMERIC | Preço da variação |
| sort_order | INTEGER | Ordem de exibição |
| is_active | BOOLEAN | Se está visível |

### Tabela: `user_roles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| role | ENUM | 'admin' ou 'user' |

---

## ✅ Checklist de Manutenção

Antes de fazer alterações:

- [ ] Verifique se está na branch correta
- [ ] Faça backup se for alteração grande
- [ ] Teste localmente antes de publicar

Após fazer alterações:

- [ ] Teste a funcionalidade modificada
- [ ] Verifique se não quebrou outras partes
- [ ] Publique as alterações no Lovable
