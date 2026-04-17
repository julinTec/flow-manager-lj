
# Plano: Pipeline Kanban para Devis

## Resumo
Evoluir o módulo Devis com 11 novos status de pipeline comercial, cores visuais e uma visualização Kanban com drag-and-drop entre colunas.

## 1. Banco de Dados (migração)

Atualizar enum `devis_status` adicionando os novos valores (mantendo os antigos para compatibilidade):
- `reuniao_realizada`
- `proposta_em_geracao`
- `aguardando_validacao`
- `pronta_para_envio`
- `enviada_ao_cliente`
- `aguardando_aceite`
- `aceita`
- `rejeitada`
- `cobranca_pendente`
- `entrada_recebida`
- `enviado_para_operacao`

(Postgres: `ALTER TYPE devis_status ADD VALUE IF NOT EXISTS ...` para cada um.)

## 2. Mapa de status (centralizado)

Criar `src/lib/devisStatus.ts` com:
- Lista ordenada dos 11 status do pipeline
- Labels em PT-BR
- Classes Tailwind de cor por status (badges + borda da coluna kanban), ex.:
  - reuniao_realizada → slate
  - proposta_em_geracao → blue
  - aguardando_validacao → amber
  - pronta_para_envio → indigo
  - enviada_ao_cliente → cyan
  - aguardando_aceite → yellow
  - aceita → green
  - rejeitada → red
  - cobranca_pendente → orange
  - entrada_recebida → emerald
  - enviado_para_operacao → violet

Usar este mapa em `Comercial.tsx` e `DevisDetail.tsx` para substituir os atuais `statusLabels` / `devisStatusColors`.

## 3. Página `Comercial.tsx` — adicionar visualização Kanban

Dentro da aba **Devis**, adicionar um sub-toggle (Tabs ou ToggleGroup): **Lista** | **Kanban**.

- **Lista**: mantém a tabela atual, mas com novas opções de status no filtro e no select de criação.
- **Kanban**: nova view com colunas roláveis horizontalmente.

## 4. Componente Kanban (`src/components/devis/DevisKanban.tsx`)

- Layout: `flex gap-4 overflow-x-auto` com 11 colunas de largura fixa (~280px).
- Cada coluna mostra: título (label do status com cor), contador, lista de cards.
- Card mostra: Cliente, Valor (BRL), Responsável (nome), Data da reunião. Clique abre `/comercial/devis/:id`.
- Drag-and-drop com **@dnd-kit/core** + **@dnd-kit/sortable** (já comum no stack; adicionar via npm).
- Ao soltar em outra coluna: chamar `supabase.from('devis').update({ status: novoStatus }).eq('id', cardId)` e invalidar React Query (atualização otimista).
- Respeitar filtros ativos (cliente, período) — status filter fica desabilitado/ignorado no modo Kanban.

## 5. Atualizar selects de status

Em `Comercial.tsx` (criação + filtro) e `DevisDetail.tsx` (edição): popular options a partir do mapa central (inclui novos + antigos para retrocompatibilidade).

## 6. Detalhes técnicos
- Sem mudança de RLS — policies atuais cobrem update.
- Atualização otimista no Kanban com rollback em caso de erro (toast).
- Default de novos Devis continua `rascunho` (mantido).

## Ordem de execução
1. Migração: estender enum `devis_status`
2. Criar `src/lib/devisStatus.ts`
3. Instalar `@dnd-kit/core` e `@dnd-kit/sortable`
4. Criar `src/components/devis/DevisKanban.tsx`
5. Atualizar `src/pages/Comercial.tsx` (toggle Lista/Kanban + selects)
6. Atualizar `src/pages/DevisDetail.tsx` (selects + cores)
