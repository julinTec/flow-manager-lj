
# Plano: Envio de proposta ao cliente por e-mail

## Resumo
Adicionar botão **"Enviar proposta"** na tela de detalhe do Devis que abre um **modal de preview** com o e-mail pré-gerado. Após confirmar, envia via Lovable Emails, registra `sent_at`, `sent_to` e move o status para `enviada_ao_cliente`. O cliente recebe um link de aceite que abre uma página pública confirmando o aceite (sem login).

## Pré-requisitos
- Domínio de e-mail configurado (Lovable Emails). Se não houver, mostrar dialog de setup primeiro.
- Devis precisa estar **validado** (`validated_at != null`) — reutiliza a lógica já existente de `requiresValidation`.
- Cliente precisa ter e-mail cadastrado (`clients.email`).

## 1. Banco de dados (migração)
Adicionar em `devis`:
- `sent_at` (timestamptz, nullable)
- `sent_to` (text, nullable) — e-mail destinatário
- `sent_by` (uuid, nullable)
- `accept_token` (uuid, default `gen_random_uuid()`, unique) — token público para aceite
- `accepted_at` (timestamptz, nullable)

RLS: adicionar policy pública de `SELECT` em `devis` filtrando por `accept_token` (apenas colunas necessárias via view, ou checar token na edge function pública). Optar por **edge function pública** que valida o token e retorna apenas os campos do preview — mais seguro que policy aberta.

## 2. Template de e-mail
- Rodar `email_domain--setup_email_infra` (se ainda não rodado)
- Rodar `email_domain--scaffold_transactional_email`
- Criar template `proposal-to-client.tsx` em `_shared/transactional-email-templates/`:
  - Nome do cliente, título, resumo do serviço/escopo, valor total, valor de entrada, prazo
  - Botão CTA **"Aceitar proposta"** apontando para `${APP_URL}/proposta/aceite/${accept_token}`
  - Branding Lundgaard Hub
- Registrar no `registry.ts`

## 3. Edge functions
- **`send-devis-proposal`** (autenticada): valida que o devis está validado, gera token se não existe, invoca `send-transactional-email` com `templateData`, atualiza `sent_at`/`sent_to`/`sent_by`/`status='enviada_ao_cliente'`.
- **`accept-devis-proposal`** (pública, `verify_jwt = false`): GET retorna preview do devis pelo token; POST marca `accepted_at = now()` e move status para `aceita`.

## 4. Frontend
**`src/pages/DevisDetail.tsx`:**
- Botão **"Enviar proposta"** (ícone `Send`) ao lado de Editar
  - Disabled se: não validado / sem e-mail do cliente / já enviado
  - Tooltip explicando bloqueio
- Modal `SendProposalDialog`:
  - Preview do e-mail (renderiza HTML do template com dados reais)
  - Campo editável: e-mail destinatário (default `client.email`)
  - Campo editável: mensagem adicional opcional
  - Botões "Cancelar" / "Confirmar envio"
- Após envio: toast sucesso, exibe badge "Enviada em DD/MM/YYYY HH:mm para {email}"

**Nova página pública `src/pages/AceitarProposta.tsx`** (rota `/proposta/aceite/:token`, fora do `AppLayout`):
- Busca dados via `accept-devis-proposal` GET
- Mostra resumo da proposta + botão "Aceitar proposta"
- Confirmação após aceite + estado "já aceita anteriormente"
- Adicionar rota em `App.tsx`

## 5. Detalhes
- Reaproveita `STATUSES_REQUIRING_VALIDATION` (já bloqueia mover para `enviada_ao_cliente` sem validação)
- Sem novas dependências
- O Kanban já bloqueia drag-and-drop para `enviada_ao_cliente` sem validação — mantém consistência

## Ordem de execução
1. Setup email infra + scaffold transactional (se necessário)
2. Migração: adicionar 5 colunas em `devis`
3. Criar template `proposal-to-client.tsx` + registrar
4. Criar edge functions `send-devis-proposal` e `accept-devis-proposal`
5. Criar `SendProposalDialog.tsx` + integrar em `DevisDetail.tsx`
6. Criar página pública `AceitarProposta.tsx` + rota
