# ⚙️ CONFIGURAÇÃO DO PROJETO

Este documento explica todas as variáveis de ambiente e configurações necessárias para rodar o projeto.

---

## 📋 Variáveis de Ambiente

### Usando Lovable Cloud (Configuração Automática)

Se você está usando o Lovable Cloud, o arquivo `.env` é gerado automaticamente. **NÃO edite manualmente!**

### Usando Supabase Próprio (Configuração Manual)

Se você está migrando para um Supabase próprio:

1. Copie o arquivo `.env.example` para `.env`
2. Preencha com suas credenciais do Supabase

```bash
cp .env.example .env
```

### Variáveis Disponíveis

| Variável | Descrição | Onde Encontrar |
|----------|-----------|----------------|
| `VITE_SUPABASE_URL` | URL do banco de dados Supabase | Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública de acesso (anon key) | Dashboard > Settings > API > anon public |
| `VITE_SUPABASE_PROJECT_ID` | ID único do projeto | Parte da URL (ex: `abcdef123` de `abcdef123.supabase.co`) |

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

## 🔄 MIGRAÇÃO PARA SUPABASE PRÓPRIO

### Passo 1: Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub ou email
4. Clique em **"New Project"**
5. Escolha um nome e senha para o banco
6. Selecione a região mais próxima (ex: São Paulo)
7. Aguarde a criação (~2 minutos)

### Passo 2: Executar o Script SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo `SCRIPT_MIGRACAO_COMPLETO.sql` deste projeto
4. Copie TODO o conteúdo e cole no editor
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde a execução (~30 segundos)

### Passo 3: Obter Credenciais

1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** (em Project API keys) → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - O ID do projeto está na URL (ex: `abcdef123.supabase.co` → ID é `abcdef123`)

### Passo 4: Configurar Storage

1. Vá em **Storage** no menu lateral
2. O bucket `images` já foi criado pelo script
3. Verifique se está como **Public**

### Passo 5: Criar Usuário Admin

1. Vá em **Authentication** > **Users**
2. Clique em **"Add user"**
3. Preencha email e senha
4. Clique em **"Create user"**
5. Copie o **User UID** (UUID do usuário criado)
6. Vá em **SQL Editor** e execute:

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('COLE_O_USER_UID_AQUI', 'admin');
```

### Passo 6: Desativar Confirmação de Email (Opcional)

Para facilitar testes:

1. Vá em **Authentication** > **Providers**
2. Clique em **Email**
3. Desative **"Confirm email"**
4. Salve

### Passo 7: Configurar o Projeto

1. No VS Code, copie `.env.example` para `.env`
2. Preencha com suas credenciais
3. Execute `npm install`
4. Execute `npm run dev`
5. Acesse `http://localhost:5173`
6. Teste o login em `/auth` com o usuário admin criado

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
| **Aplicação Publicada** | Depende da hospedagem (ver HOSPEDAGEM.md) |
| **Painel Admin** | `/admin` (requer login) |
| **Dashboard Supabase** | `https://supabase.com/dashboard/project/SEU_PROJECT_ID` |

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
- **NÃO EDITAR** - gerado automaticamente (apenas no Lovable Cloud)

---

## 📝 Como Adicionar Novas Variáveis

Se precisar adicionar novas variáveis de ambiente:

1. **Para variáveis públicas** (acessíveis no frontend):
   - Prefixo obrigatório: `VITE_`
   - Exemplo: `VITE_MINHA_VARIAVEL=valor`

2. **Para variáveis privadas** (só no backend):
   - Use o sistema de Secrets do Supabase
   - Ou configure no servidor de hospedagem

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

### "Não consigo fazer login como admin"
- Verifique se o usuário foi criado corretamente
- Confirme se a role foi adicionada (tabela `user_roles`)
- Verifique se "Confirm email" está desativado

### "Imagens não carregam"
- Verifique se o bucket `images` existe e está público
- Confira as políticas RLS do storage
