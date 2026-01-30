

## Plano: Atualizar Cardapio + Script SQL Completo

### Parte 1: Atualizacoes no Lovable Cloud

Vou executar as seguintes operacoes no banco de dados do Lovable Cloud:

#### 1.1 Atualizar Precos das Variacoes de Pizza
- Pequena: R$30 → R$40
- Media: R$35 → R$44
- Grande: R$40 → R$48

#### 1.2 Atualizar Precos dos Hamburgueres Artesanais
8 produtos com novos precos (R$17 a R$23)

#### 1.3 Atualizar Precos dos Hamburgueres Tradicionais
11 produtos com novos precos (R$10 a R$20)

#### 1.4 Atualizar Precos das Porcoes
4 produtos com precos ajustados

#### 1.5 Atualizar Precos das Chapas
- Especial da Casa [2 pessoas]: R$150 → R$120
- Especial da Casa [3 pessoas]: R$180 → R$150

#### 1.6 Atualizar Baguete de Costela
- Preco: R$17 → R$15

#### 1.7 Mover Pao de Alho
- Da categoria Churrasco para Porcoes

#### 1.8 Criar Categoria Picanha na Pedra
Nova categoria com 4 produtos:
- Picanha Simples [2 pessoas] - R$120
- Picanha Simples [3 pessoas] - R$150
- Picanha Completa [2 pessoas] - R$130
- Picanha Completa [3 pessoas] - R$180

#### 1.9 Criar Adicionais para Baguete
5 adicionais a R$2 cada: Vinagrete, Batata palha, Salada, Cheddar, Barbecue

---

### Parte 2: Script SQL Completo para Supabase Externo

Vou atualizar o arquivo `SCRIPT_MIGRACAO_COMPLETO.sql` com:

1. **Script de estrutura completa** (caso precise recriar o banco)
2. **Script de atualizacao de dados** (para aplicar apenas as mudancas de precos)

O script incluira:
- Todos os UPDATEs de precos
- INSERT da nova categoria Picanha na Pedra
- INSERT dos 4 produtos de Picanha
- INSERT dos adicionais de Baguete
- UPDATE para mover Pao de Alho

---

### Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `SCRIPT_MIGRACAO_COMPLETO.sql` | Atualizar com dados novos + script de atualizacao |

### Operacoes no Banco Lovable Cloud

Serao executados varios comandos SQL via ferramenta de insercao para atualizar os dados.

---

### Secao Tecnica: Queries a Executar

```sql
-- 1. Atualizar variacoes de pizza
UPDATE product_variations SET price = 40 WHERE name = 'Pequena';
UPDATE product_variations SET price = 44 WHERE name = 'Média';
UPDATE product_variations SET price = 48 WHERE name = 'Grande';

-- 2. Atualizar hamburgueres artesanais (por nome)
UPDATE products SET price = 17 WHERE name = 'Cheddar MC Melt';
UPDATE products SET price = 18 WHERE name = 'Chicken Burguer';
-- ... etc

-- 3. Criar categoria Picanha na Pedra
INSERT INTO categories (name, description, sort_order) 
VALUES ('Picanha na Pedra', 'Picanha servida na pedra', 8);

-- 4. Criar produtos de Picanha
INSERT INTO products (name, description, price, category_id) VALUES ...

-- 5. Criar adicionais para Baguete
INSERT INTO category_addons (category_id, name, price) VALUES ...
```

