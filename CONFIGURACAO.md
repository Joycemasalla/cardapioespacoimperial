# ⚙️ CONFIGURAÇÃO DO PROJETO

Este documento explica todas as variáveis de ambiente e configurações necessárias para rodar o projeto.

---

## 📋 Variáveis de Ambiente (.env)

O arquivo `.env` contém as credenciais para conectar ao banco de dados. 

> ⚠️ **IMPORTANTE**: Este arquivo é gerado automaticamente pelo Lovable Cloud. NÃO edite manualmente!

### Variáveis Disponíveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do banco de dados Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública de acesso (anon key) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_SUPABASE_PROJECT_ID` | ID único do projeto | `uqmdeopssmmawwmefhke` |

### O que cada variável faz?

1. **VITE_SUPABASE_URL**
   - É o endereço do seu banco de dados na nuvem
   - Usado para fazer todas as requisições de dados (produtos, categorias, pedidos)

2. **VITE_SUPABASE_PUBLISHABLE_KEY**
   - Chave pública para autenticação anônima
   - Permite que usuários não logados vejam o cardápio
   - É seguro expor essa chave (é pública por design)

3. **VITE_SUPABASE_PROJECT_ID**
   - Identificador único do projeto
   - Usado internamente para URLs e configurações

---

## 🔐 Segurança

### Chaves Públicas vs Privadas

- **Chave Pública (PUBLISHABLE_KEY)**: Pode ser exposta no frontend ✅
- **Chave Privada (SERVICE_ROLE_KEY)**: NUNCA expor no frontend ❌

A segurança dos dados é garantida pelas **políticas RLS (Row Level Security)** configuradas no banco.

### O que é RLS?

RLS são regras que controlam quem pode ver/editar cada dado:

| Tabela | Regra |
|--------|-------|
| `products` | Qualquer um pode VER produtos ativos. Só admin pode EDITAR. |
| `categories` | Qualquer um pode VER. Só admin pode EDITAR. |
| `orders` | Qualquer um pode CRIAR pedido. Só admin pode VER todos. |
| `settings` | Qualquer um pode VER. Só admin pode EDITAR. |
| `user_roles` | Usuário só vê suas próprias permissões. |

---

## 🌐 URLs Importantes

| O que | URL |
|-------|-----|
| **Aplicação Local** | `http://localhost:5173` |
| **Aplicação Publicada** | Disponível após publicar no Lovable |
| **Painel Admin** | `/admin` (requer login) |

---

## 🗄️ Banco de Dados

O projeto usa **Supabase** (baseado em PostgreSQL) com as seguintes tabelas:

### Tabelas Principais

| Tabela | Descrição | Campos principais |
|--------|-----------|-------------------|
| `products` | Produtos do cardápio | id, name, price, description, image_url, category_id |
| `categories` | Categorias de produtos | id, name, description, image_url, sort_order |
| `orders` | Pedidos realizados | id, customer_name, customer_phone, items, total, status |
| `settings` | Configurações da loja | whatsapp_number, store_name, delivery_fee, pix_key |
| `promotions` | Promoções ativas | id, product_id, discount_percent, is_active |
| `product_variations` | Variações (tamanhos) | id, product_id, name, price |
| `profiles` | Perfis de usuários | id, full_name, phone |
| `user_roles` | Permissões de admin | id, user_id, role |

---

## 🔧 Arquivos de Configuração

### `tailwind.config.ts`
- Define as cores do tema (primária, secundária, etc)
- Configura fontes personalizadas
- Adiciona animações customizadas

### `vite.config.ts`
- Configuração do servidor de desenvolvimento
- Aliases de importação (`@/` = `src/`)
- Plugins do Vite

### `supabase/config.toml`
- Configuração do projeto Supabase
- **NÃO EDITAR** - gerado automaticamente

---

## 📝 Como Adicionar Novas Variáveis

Se precisar adicionar novas variáveis de ambiente:

1. **Para variáveis públicas** (acessíveis no frontend):
   - Prefixo obrigatório: `VITE_`
   - Exemplo: `VITE_MINHA_VARIAVEL=valor`

2. **Para variáveis privadas** (só no backend):
   - Use o sistema de Secrets do Lovable Cloud
   - Acesse: Configurações > Cloud > Secrets

3. **Acessar no código**:
   ```typescript
   // No frontend
   const valor = import.meta.env.VITE_MINHA_VARIAVEL;
   
   // No backend (edge functions)
   const valor = Deno.env.get('MINHA_VARIAVEL');
   ```

---

## ❓ Resolução de Problemas

### "Não consigo conectar ao banco"
- Verifique se o arquivo `.env` existe
- Confirme se as variáveis estão corretas
- Reinicie o servidor: `npm run dev`

### "Erro de CORS"
- Isso não deve acontecer com Supabase configurado corretamente
- Verifique se a URL do Supabase está correta

### "Dados não aparecem"
- Verifique se existem dados no banco (painel admin)
- Confira as políticas RLS da tabela
- Veja o console do navegador (F12) para erros
