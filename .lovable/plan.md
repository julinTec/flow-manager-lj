

# Plano: Estruturar módulo Devis (Comercial)

## Resumo
Reestruturar o módulo Devis para ser o centro comercial: cadastro completo de Clientes (com tipo PF/PJ) e Propostas (Devis) com data de reunião, responsável comercial, resumo, valor total e valor de entrada (50% automático). Adicionar listagem com filtros e tela de detalhe editável.

## Alterações no Banco de Dados

### Tabela `clients` — adicionar
- `type` (text: 'PF' | 'PJ') — default 'PJ'
- (campos `email`, `phone`, `document`, `notes` já existem; `address` e `city` ficam opcionais/ocultos)

### Tabela `devis` — adicionar
- `meeting_date` (date)
- `commercial_responsible` (uuid → referencia profiles.user_id, opcional)
- `meeting_summary` (text)
- `down_payment_amount` (numeric) — calculado como 50% do `total_amount`
- `notes` (text)

Trigger: ao inserir/atualizar `total_amount`, recalcular `down_payment_amount = total_amount * 0.5` automaticamente.

## Alterações no Frontend

### 1. `src/pages/Comercial.tsx` → reorganizar (manter rota `/comercial`)
Estrutura em **abas**:
- **Clientes** (lista + criar/editar)
- **Devis** (lista com filtros + criar)

### 2. Cadastro de Cliente (modal)
Campos: Nome, Email, Telefone, Documento, **Tipo (PF/PJ)** via Select, Observações.

### 3. Lista de Clientes
Tabela: Nome, Tipo, Email, Telefone, Documento, Ações (editar).

### 4. Cadastro de Devis (modal)
Campos:
- Cliente (Select com busca)
- Data da reunião (DatePicker)
- Responsável comercial (Select de usuários do sistema)
- Resumo da reunião (Textarea)
- Status (Select: rascunho/enviado/aprovado/rejeitado/convertido)
- Valor total (Input numérico)
- Valor de entrada (Input — auto-preenchido com 50%, editável)
- Observações (Textarea)

### 5. Lista de Devis com filtros
Tabela: Cliente, Status, Valor Total, Valor Entrada, Data Reunião, Responsável, Ações (ver/editar).

Filtros no topo:
- Status (Select)
- Cliente (Select)
- Período (Data início / Data fim)

### 6. Tela de detalhe do Devis
Nova rota `/comercial/devis/:id` (`src/pages/DevisDetail.tsx`):
- Exibe todos os campos em layout de card
- Botão "Editar" abre formulário inline / dialog com todos os campos
- Botão "Voltar" para a listagem
- Mostra cliente vinculado, datas, valores formatados em BRL

### 7. Roteamento
Adicionar `/comercial/devis/:id` em `src/App.tsx` (protegida, mesma proteção atual).

## Detalhes técnicos
- DatePicker: usar Shadcn Calendar+Popover com `pointer-events-auto`
- Responsável comercial: buscar de `profiles` (lista todos os usuários com role admin ou gerencial)
- Valor de entrada: calculado no client ao alterar valor total; salvo no banco
- Filtros: aplicados via query params no React Query
- Validação com `zod` para os formulários
- Manter título da página como "Devis" e descrição "Gestão comercial — clientes e propostas"

## Ordem de execução
1. Migração: adicionar colunas em `clients` e `devis` + trigger de cálculo do down_payment
2. Reescrever `src/pages/Comercial.tsx` (abas, formulários, filtros)
3. Criar `src/pages/DevisDetail.tsx`
4. Adicionar rota no `src/App.tsx`

