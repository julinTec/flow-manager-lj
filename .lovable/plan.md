
O campo "Relatório da reunião" e o botão "Gerar proposta automaticamente" foram adicionados **somente na tela de detalhe do Devis** (`src/pages/DevisDetail.tsx`), e **só aparecem no modo de edição**.

## Onde está hoje

Para ver:
1. Vá em `/comercial` → aba **Devis**
2. Clique em um devis da lista (ou no card do Kanban) para abrir a tela de detalhe
3. Clique no botão **"Editar"** no topo direito
4. Role até a seção **"Relatório da reunião"** — abaixo dela está o botão **"Gerar proposta automaticamente"** (com ícone Sparkles)
5. Após gerar, aparece o bloco **"Sugestões da IA"** com os 4 campos editáveis

## Por que não aparece no `/comercial`

No plano original estava previsto adicionar também ao **modal de criação** em `Comercial.tsx`, mas isso **não foi implementado** — o modal de criação rápida continua só com os campos básicos (cliente, data, valor, status, etc.). É por isso que você não vê nada na tela `/comercial`.

## Proposta de correção

Adicionar ao modal "Novo Devis" em `src/pages/Comercial.tsx`:
- Campo **Textarea "Relatório da reunião"** (rows=6) abaixo do campo "Resumo da reunião"
- Botão **"Gerar proposta automaticamente"** (ícone Sparkles, com loading state)
- Reutilizar o componente `AISuggestionsBlock` já existente, exibindo as sugestões inline dentro do modal
- Ao salvar o devis, persistir também `meeting_report`, `service_type`, `responsible_sector`, `scope_description`, `proposal_structure` (campos já existentes na tabela)
- Nada é sobrescrito automaticamente — usuário aceita campo a campo ou "Aceitar todas" antes de salvar

Sem mudanças de banco de dados nem novas dependências.
