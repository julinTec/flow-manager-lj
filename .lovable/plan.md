
# Plano: Cobrança automática ao aceitar proposta

## Resumo
Quando o cliente aceitar a proposta (via página pública), gerar automaticamente um registro de cobrança de 50% do valor total no módulo financeiro e mover o status do Devis para `cobranca_pendente`.

## Análise do existente
- A regra de billing 50%/50% já está documentada em memory (`mem://features/billing/logic`).
- A coluna `devis.initial_charge_generated` já existe — usada como flag de idempotência.
- O aceite hoje (em `accept-devis-proposal`) seta `status = 'aceita'`. Vamos trocar para `cobranca_pendente` e gerar o registro financeiro no mesmo fluxo.
- `financial_entries` é a tabela alvo (módulo Financeiro/Conciliação já consome). Campos relevantes: `entry_date`, `amount_in`, `amount_signed`, `entry_type`, `counterparty_name`, `movement_description`, `business_unit`, `competence_month`, `source_type`, `conciliation_status='pendente'`.

## 1. Verificação rápida (durante implementação)
Ler `mem://features/billing/logic` e checar enum `devis_status` (precisa conter `cobranca_pendente`) + enum `source_type` / `entry_type` em `financial_entries` para usar valores válidos.

## 2. Edge function `accept-devis-proposal` — alterar POST
No bloco de aceite, dentro de uma sequência transacional (best-effort):
1. Buscar devis completo (já buscado) + `clients.name` + `business_unit`.
2. `UPDATE devis SET accepted_at, accepted_ip, status='cobranca_pendente', initial_charge_generated=true WHERE id=? AND initial_charge_generated=false` (idempotência via flag).
3. Se update afetou linha (primeira vez): `INSERT INTO financial_entries`:
   - `entry_date = today`
   - `amount_in = total_amount * 0.5` (usar `down_payment_amount` se já calculado, fallback para 50%)
   - `amount_signed = +valor`
   - `entry_type = 'receita'` (a confirmar pelo enum)
   - `counterparty_name = client.name`
   - `movement_description = 'Cobrança inicial 50% — Devis #{reference_number} — {title}'`
   - `business_unit = devis.business_unit`
   - `competence_month = YYYY-MM`
   - `source_type = 'devis_auto'` (ou valor existente apropriado, ex.: `'manual'` com flag)
   - `conciliation_status = 'pendente'`
   - `document_reference = devis.reference_number`
4. Registrar em `audit_logs` (action `devis_accepted_charge_created`).
5. Se já aceito (`accepted_at` existente): apenas retornar preview, sem nova cobrança.

## 3. Frontend — `DevisDetail.tsx` e Kanban
- Badge de aceite continua igual.
- Adicionar badge azul **"Cobrança inicial gerada"** quando `initial_charge_generated = true`.
- Status `cobranca_pendente` já é renderizado pelo `devisStatus.ts` no Kanban — verificar se existe o label; se faltar, adicionar.
- Página pública `AceitarProposta.tsx`: após aceite, mensagem evolui para "Proposta aceita! Em breve você receberá a cobrança inicial de 50%."

## 4. Página pública — sem mudanças estruturais
GET continua retornando o preview. POST agora também dispara a cobrança server-side (transparente ao cliente).

## Detalhes
- Idempotência garantida pela combinação `accepted_at IS NULL` + `initial_charge_generated = false` no WHERE do UPDATE.
- Sem novas tabelas, sem novas dependências.
- Sem mudança de schema, exceto se faltar `cobranca_pendente` no enum `devis_status` ou um valor adequado em `entry_type`/`source_type` — nesse caso, migração mínima para ALTER TYPE ADD VALUE.

## Ordem de execução
1. Validar enums (`devis_status`, `entry_type`, `source_type`) — migração só se faltar valor.
2. Atualizar edge function `accept-devis-proposal` (lógica de cobrança + status novo).
3. Atualizar `devisStatus.ts` se necessário e adicionar badge "Cobrança gerada" em `DevisDetail.tsx`.
4. Ajustar mensagem de sucesso em `AceitarProposta.tsx`.
