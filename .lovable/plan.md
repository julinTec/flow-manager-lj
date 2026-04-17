
# Plano: Geração assistida de proposta com IA no Devis

## Resumo
Adicionar um campo "Relatório da reunião" e um botão "Gerar proposta automaticamente" que chama uma edge function usando Lovable AI. O resultado aparece num bloco "Sugestões da IA" com campos editáveis — nada é sobrescrito automaticamente; o usuário decide aceitar cada sugestão.

## 1. Banco de dados (migração)

Adicionar em `devis`:
- `meeting_report` (text) — relatório longo da reunião (insumo para IA)
- `service_type` (text)
- `responsible_sector` (text)
- `scope_description` (text)
- `proposal_structure` (text)

Todos nullable, sem default.

## 2. Edge Function `generate-devis-proposal`

Arquivo: `supabase/functions/generate-devis-proposal/index.ts`
- Recebe `{ meeting_report, client_name?, total_amount? }`
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) via **tool calling** para garantir JSON estruturado com:
  - `service_type` (string)
  - `responsible_sector` (string) — ex: Engenharia, Consultoria, TI, Jurídico
  - `scope_description` (string, markdown)
  - `proposal_structure` (string, markdown com seções: Objetivo, Escopo, Entregáveis, Cronograma, Investimento)
- Trata 429/402 e retorna erros amigáveis
- System prompt em PT-BR, corporativo, conciso
- `verify_jwt = true` (usuário autenticado); usa `LOVABLE_API_KEY` (já disponível via Cloud)

## 3. Tela de Detalhe (`src/pages/DevisDetail.tsx`)

Na seção editável, adicionar:

### a) Campo "Relatório da reunião"
- `Textarea` (rows=8), acima do "Resumo da reunião"
- Salvo em `meeting_report`

### b) Botão "Gerar proposta automaticamente"
- Abaixo do campo, com ícone `Sparkles`
- Desabilitado se `meeting_report` vazio
- Loading state enquanto gera

### c) Bloco "Sugestões da IA" (aparece após resposta)
Card destacado (`border-primary/40 bg-primary/5`) com título "Sugestões da IA" e ícone Sparkles. Contém 4 blocos, cada um com:
- Label do campo
- Textarea editável pré-preenchido com sugestão
- Botão "Aceitar" (aplica ao form principal) e "Descartar"
- Botão geral "Aceitar todas"

Os valores aceitos populam os novos campos do form (`service_type`, `responsible_sector`, `scope_description`, `proposal_structure`) mas **só são persistidos** quando o usuário clica "Salvar" no topo.

### d) Exibição em modo leitura
Mostrar os 4 campos novos abaixo de "Observações" quando preenchidos.

## 4. Modal de criação em `Comercial.tsx`
Adicionar apenas o campo `meeting_report` (Textarea) + botão "Gerar proposta" com o mesmo fluxo. Sugestões aparecem inline dentro do modal. Mantém comportamento: nada é salvo automaticamente.

## 5. Tipos e integrações
- `src/integrations/supabase/types.ts` é auto-gerado, será atualizado pela migração
- Sem mudanças de RLS (tabela `devis` já tem policies adequadas)
- Sem novas dependências npm

## Ordem de execução
1. Migração: adicionar 5 colunas em `devis`
2. Criar edge function `generate-devis-proposal`
3. Atualizar `DevisDetail.tsx` (campo, botão, bloco Sugestões IA, modo leitura)
4. Atualizar `Comercial.tsx` (campo + botão no modal de criação)
