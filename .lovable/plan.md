
# Plano: Criar case operacional automático ao aceitar proposta

## Resumo
Quando o cliente aceitar a proposta, além da cobrança já gerada, criar automaticamente um registro em `services` (case operacional) vinculado ao cliente e ao devis, com status inicial "A iniciar". Esse case alimenta o módulo Operação.

## Análise do existente
- Tabela `services` já existe com: `devis_id`, `client_id`, `title`, `description`, `status` (enum `service_status`, default `'pendente'`), `business_unit`, `assigned_to`, `expected_end_date`, `start_date`.
- Edge function `accept-devis-proposal` já cria a cobrança financeira no POST — vamos estender o mesmo fluxo para criar o service.
- Devis tem `responsible_sector` (setor) e `business_unit` que serão propagados.
- Precisa verificar se enum `service_status` tem valor `a_iniciar` ou se devemos usar `pendente` (já é default). Provavelmente reutilizar `pendente` e exibir como "A iniciar" no frontend é mais simples, mas o usuário pediu literalmente "A iniciar" — checar enum durante implementação e adicionar valor se faltar.

## 1. Verificação rápida (durante implementação)
Consultar enum `service_status`. Se `a_iniciar` não existe, migração `ALTER TYPE service_status ADD VALUE 'a_iniciar'`. Caso já exista `pendente` cobrindo a semântica, apenas mapear label "A iniciar" no frontend.

## 2. Edge function `accept-devis-proposal` — estender POST
Após criar a cobrança e antes do audit log:
1. Verificar idempotência: `SELECT id FROM services WHERE devis_id = ? LIMIT 1`. Se já existe, pular.
2. `INSERT INTO services`:
   - `devis_id = devis.id`
   - `client_id = devis.client_id`
   - `title = devis.title`
   - `description = devis.scope_description`
   - `business_unit = devis.business_unit`
   - `status = 'a_iniciar'` (ou `pendente` se enum não tiver)
   - `expected_end_date = devis.deadline_date`
   - Setor responsável: usar `devis.responsible_sector` — como `services` não tem essa coluna hoje, **adicionar** `responsible_sector text` em `services` via migração.
3. Incluir `service_id` criado no `audit_logs.details` e na resposta da função.

## 3. Migração mínima
- `ALTER TABLE services ADD COLUMN IF NOT EXISTS responsible_sector text;`
- Se necessário: `ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'a_iniciar';`

## 4. Frontend
- **`DevisDetail.tsx`**: badge verde **"Case operacional criado"** quando existir service vinculado (consulta leve por `devis_id` ou flag derivada). Link "Ver no módulo Operação".
- **`Operacao.tsx`**: garantir que a listagem mostre o setor responsável e que o status `a_iniciar` (ou `pendente` mapeado como "A iniciar") seja renderizado corretamente.
- **`AceitarProposta.tsx`**: sem mudanças (cliente não precisa saber do case interno).

## Detalhes
- Idempotência via lookup por `devis_id` antes do insert (não há unique constraint — adicionar `UNIQUE(devis_id)` na migração para reforçar).
- Sem novas dependências.
- Setor responsável vem direto do devis (já preenchido na fase de validação).

## Ordem de execução
1. Migração: `ADD COLUMN responsible_sector`, `UNIQUE(devis_id)` em services, e (se preciso) novo valor de enum `a_iniciar`.
2. Estender `accept-devis-proposal` para criar o service após a cobrança.
3. Adicionar badge "Case operacional criado" em `DevisDetail.tsx`.
4. Ajustar listagem em `Operacao.tsx` para mostrar setor responsável e label "A iniciar".
