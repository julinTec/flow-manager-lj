
# Plano: Validação Comercial obrigatória antes do envio

## Resumo
Adicionar bloco "Validação Comercial" na tela de detalhe do Devis com checklist obrigatório de 5 itens. Enquanto não estiver 100% validado, bloquear a transição para `enviada_ao_cliente` (e status posteriores). Botão "Validar proposta" marca a validação como concluída.

## 1. Banco de dados (migração)

Adicionar em `devis`:
- `validation_client_confirmed` (boolean, default false)
- `validation_service_confirmed` (boolean, default false)
- `validation_sector_defined` (boolean, default false)
- `validation_amount_confirmed` (boolean, default false)
- `validation_deadline_defined` (boolean, default false)
- `validated_at` (timestamptz, nullable)
- `validated_by` (uuid, nullable) — referencia user que validou
- `deadline_date` (date, nullable) — prazo da proposta (insumo do checklist)

Sem mudança de RLS (policies de `devis` já cobrem update).

## 2. Componente `ValidationChecklist.tsx`

Novo arquivo: `src/components/devis/ValidationChecklist.tsx`

Card destacado com:
- Título **"Validação Comercial"** + ícone `ShieldCheck`
- 5 checkboxes (read-only fora do modo edição):
  1. Cliente confirmado
  2. Serviço confirmado
  3. Setor responsável definido
  4. Valor validado
  5. Prazo definido
- Cada item com auto-sugestão visual (✓ verde se o campo correspondente do devis estiver preenchido — `client_id`, `service_type`, `responsible_sector`, `total_amount > 0`, `deadline_date`)
- Barra de progresso (X/5)
- Botão **"Validar proposta"**:
  - Habilitado apenas quando todos os 5 itens marcados
  - Ao clicar: seta `validated_at = now()`, `validated_by = auth.uid()` e salva
- Badge de status: "Validada em DD/MM/YYYY por {nome}" quando `validated_at` existir
- Botão "Invalidar" (apenas admin/responsável) para refazer validação se algo mudar

## 3. Integração em `DevisDetail.tsx`

- Renderizar `<ValidationChecklist />` logo após o card "Informações"
- Adicionar campo **"Prazo (deadline)"** no form (DatePicker) na seção Informações, ao lado de "Data da reunião"
- No `update` mutation, persistir os 5 booleanos + `deadline_date`

## 4. Bloqueio de envio da proposta

No select de status (modo edição) de `DevisDetail.tsx`:
- Se `validated_at` for nulo, **desabilitar** as opções de status posteriores ao envio:
  - `enviada_ao_cliente`, `aguardando_aceite`, `aceita`, `rejeitada`, `cobranca_pendente`, `entrada_recebida`, `enviado_para_operacao`
- Tooltip / texto explicativo: "Valide a proposta antes de enviar ao cliente"

No Kanban (`DevisKanban.tsx`):
- No `onDragEnd`: se destino é um dos status bloqueados acima e `validated_at` é nulo → cancelar drop, mostrar toast "É necessário validar a proposta antes de enviá-la ao cliente"

## 5. Detalhes técnicos
- Validação é **revogável**: se usuário editar campos críticos depois de validar, mostrar aviso amarelo "Dados alterados após validação — revalide" (compara `updated_at` com `validated_at`)
- Sem novas dependências
- Reaproveita `Checkbox`, `Card`, `Button`, `Badge` já existentes

## Ordem de execução
1. Migração: adicionar 8 colunas em `devis`
2. Criar `src/components/devis/ValidationChecklist.tsx`
3. Atualizar `DevisDetail.tsx` (campo deadline + render do checklist + bloqueio no select de status + persistência)
4. Atualizar `DevisKanban.tsx` (bloqueio no drag-and-drop)
