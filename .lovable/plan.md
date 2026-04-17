
# Plano: Aceite público da proposta via link

## Resumo
Implementar a funcionalidade de aceite (independente do envio por e-mail, que fica para depois). O cliente acessa um link público com token, vê o resumo da proposta e clica em "Aceitar". Sistema marca `accepted_at`, registra IP e move status para `aceita`.

## 1. Migração no banco
Adicionar em `devis`:
- `accept_token` (uuid, unique, default `gen_random_uuid()`) — token público no link
- `accepted_at` (timestamptz, nullable)
- `accepted_ip` (text, nullable) — auditoria
- `sent_at` (timestamptz, nullable) — preparação para etapa de envio

Backfill: gerar `accept_token` para devis existentes.

## 2. Edge function pública `accept-devis-proposal`
- `verify_jwt = false`, validada por token
- Usa `SUPABASE_SERVICE_ROLE_KEY` (acesso restrito pelo token, não expõe RLS aberto)
- **GET** `?token=...` → retorna preview seguro: título, nome do cliente, valor total, valor de entrada, prazo (`deadline_date`), escopo, `accepted_at`. Nunca expõe IDs internos.
- **POST** `?token=...` → idempotente:
  - Se `accepted_at` já existe: retorna sucesso com data anterior
  - Senão: seta `accepted_at = now()`, `status = 'aceita'`, `accepted_ip` (do header `x-forwarded-for`)
- Retorna 404 se token inválido

## 3. Página pública `src/pages/AceitarProposta.tsx`
- Rota `/proposta/aceite/:token` em `App.tsx`, **fora** do `AppLayout` (sem sidebar, sem login)
- Estados: `loading`, `not_found`, `already_accepted`, `ready`, `success`
- UI limpa com branding Lundgaard:
  - Header com logo
  - Card central com resumo: título, "Para: {cliente}", escopo, valor total, valor de entrada, prazo
  - Botão grande **"Aceitar proposta"**
  - Após aceite: tela verde de confirmação com data/hora formatada e mensagem "Em breve nossa equipe entrará em contato"
- Responsivo (mobile-first)

## 4. Reflexo no app interno (`DevisDetail.tsx`)
- Badge verde **"Aceita pelo cliente em DD/MM/YYYY HH:mm"** quando `accepted_at` existir
- Botão **"Copiar link de aceite"** (ícone `Link`) — copia `${origin}/proposta/aceite/${accept_token}` para clipboard
  - Visível apenas quando devis está validado (`validated_at != null`)
  - Toast "Link copiado" ao clicar
  - Esse mesmo botão serve para teste agora e continua útil depois (para reenviar link manualmente)

## 5. Detalhes
- Status `aceita` já existe em `devisStatus.ts` — Kanban e listagens refletem automaticamente
- Sem dependência do envio por e-mail (que fica para próxima etapa)
- Sem novas dependências npm

## Ordem de execução
1. Migração: 4 colunas + backfill de tokens
2. Edge function `accept-devis-proposal` (GET + POST)
3. Página `AceitarProposta.tsx` + rota pública em `App.tsx`
4. Botão "Copiar link" + badge de aceite em `DevisDetail.tsx`
