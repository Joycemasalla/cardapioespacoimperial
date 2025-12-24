# 🚀 GUIA DE HOSPEDAGEM GRATUITA

Este guia explica como hospedar seu cardápio digital gratuitamente na internet.

---

## 📋 Opções de Hospedagem

| Plataforma | Gratuito | Dificuldade | Deploy Automático |
|------------|----------|-------------|-------------------|
| **Vercel** | ✅ Sim | Fácil | ✅ Via GitHub |
| **Netlify** | ✅ Sim | Fácil | ✅ Via GitHub |
| **Railway** | ✅ Sim (limitado) | Médio | ✅ Via GitHub |

**Recomendação**: Use a **Vercel** - é a mais simples e funciona perfeitamente com React/Vite.

---

## 🔷 OPÇÃO 1: VERCEL (Recomendado)

### Passo 1: Preparar o Código no GitHub

1. Acesse [github.com](https://github.com) e crie uma conta (se não tiver)
2. Crie um novo repositório clicando em **"New"**
3. Dê um nome (ex: `cardapio-espaco-imperial`)
4. Deixe como **Public** ou **Private**
5. No VS Code, execute:

```bash
# Inicializar Git (se ainda não fez)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Versão inicial do cardápio"

# Conectar ao seu repositório (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/cardapio-espaco-imperial.git

# Enviar o código
git push -u origin main
```

### Passo 2: Conectar à Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **"Sign Up"**
2. Escolha **"Continue with GitHub"**
3. Autorize o acesso ao GitHub
4. Clique em **"Add New Project"**
5. Selecione o repositório `cardapio-espaco-imperial`
6. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente

Na tela de configuração do projeto:

1. Clique em **"Environment Variables"**
2. Adicione as seguintes variáveis:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://SEU_PROJETO.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sua_chave_anon_aqui` |
| `VITE_SUPABASE_PROJECT_ID` | `seu_project_id` |

3. Clique em **"Deploy"**

### Passo 4: Aguardar Deploy

- O deploy leva cerca de 1-2 minutos
- Quando terminar, você receberá uma URL como: `https://cardapio-espaco-imperial.vercel.app`
- Esta é a URL do seu cardápio online! 🎉

### Atualizações Automáticas

Sempre que você fizer `git push` para o GitHub, a Vercel automaticamente:
1. Detecta as mudanças
2. Faz um novo build
3. Publica a versão atualizada

---

## 🔶 OPÇÃO 2: NETLIFY

### Passo 1: Preparar o Código

Mesmo processo do GitHub descrito na Vercel.

### Passo 2: Conectar à Netlify

1. Acesse [netlify.com](https://netlify.com) e clique em **"Sign Up"**
2. Escolha **"GitHub"** para login
3. Clique em **"Add new site"** > **"Import an existing project"**
4. Selecione **"Deploy with GitHub"**
5. Autorize e escolha seu repositório

### Passo 3: Configurar Build

Na tela de configuração:

- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Passo 4: Variáveis de Ambiente

1. Vá em **Site settings** > **Environment variables**
2. Adicione as mesmas variáveis da Vercel
3. Clique em **"Deploy site"**

---

## 🔷 OPÇÃO 3: RAILWAY

Railway é mais indicado para quem quer controle total.

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"** > **"Deploy from GitHub repo"**
4. Selecione o repositório
5. Adicione as variáveis de ambiente
6. Deploy automático

---

## 🌐 DOMÍNIO PERSONALIZADO

Quer usar um domínio como `www.espacoimperial.com.br`?

### Comprar um Domínio

| Serviço | Preço Aproximado |
|---------|------------------|
| [Registro.br](https://registro.br) | R$ 40/ano (.com.br) |
| [GoDaddy](https://godaddy.com) | R$ 50/ano |
| [Namecheap](https://namecheap.com) | R$ 45/ano |

### Conectar na Vercel

1. No dashboard da Vercel, vá em **Settings** > **Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `espacoimperial.com.br`)
4. Siga as instruções para configurar o DNS

---

## ❓ Perguntas Frequentes

### Quanto custa hospedar na Vercel?

**Gratuito!** O plano gratuito da Vercel inclui:
- 100 GB de bandwidth/mês
- Deploys ilimitados
- SSL automático (HTTPS)
- CDN global

### Preciso pagar pelo Supabase?

O plano gratuito do Supabase inclui:
- 500 MB de banco de dados
- 1 GB de storage
- 50.000 requisições/mês
- Autenticação ilimitada

Para um cardápio, isso é mais que suficiente!

### Como atualizar o site depois?

1. Faça as alterações no código
2. Execute:
```bash
git add .
git commit -m "Descrição da alteração"
git push
```
3. A Vercel/Netlify atualiza automaticamente em ~1 minuto

### O site fica fora do ar durante atualizações?

Não! As plataformas usam **zero-downtime deployment**. A nova versão só entra no ar quando estiver 100% pronta.

---

## 📱 Checklist Final

- [ ] Código no GitHub
- [ ] Projeto na Vercel/Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Testou o site no celular
- [ ] Criou conta admin e testou o painel
- [ ] Enviou link para o cliente

---

## 🆘 Suporte

Se tiver problemas:

1. **Erro de build**: Verifique se `npm run build` funciona localmente
2. **Variáveis de ambiente**: Confira se estão todas configuradas
3. **Página em branco**: Verifique o console (F12) para erros
4. **Dados não aparecem**: Verifique a conexão com o Supabase

---

## 🎉 Parabéns!

Seu cardápio digital está online e pronto para receber pedidos!

URL do seu cardápio: `https://SEU-PROJETO.vercel.app`

Compartilhe com seu cliente! 🚀
