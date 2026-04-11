
# Sistema de Gestão Empresarial — Plano de Implementação v1

## Visão Geral
Sistema web modular para gestão operacional, financeira e gerencial de um grupo empresarial, com foco inicial no módulo financeiro e conciliação bancária. Interface em Português (BR), backend via Lovable Cloud (Supabase), autenticação simples com roles definidos.

---

## 1. Estrutura de Navegação e Layout
- **Sidebar** com menu lateral contendo todos os módulos: Dashboard, Comercial, Financeiro, Conciliação Bancária, Operação, Gestão, Consolidação/BI, Administração
- **Header** com nome do usuário, empresa ativa e botão de logout
- **Design corporativo** limpo, tons neutros com acentos azuis, tipografia profissional
- Módulos não funcionais exibem estado "Em breve" com ícone e descrição

## 2. Banco de Dados (Lovable Cloud / Supabase)

### Tabelas principais:
- **business_units** — cadastro de empresas/negócios
- **bank_accounts** — contas bancárias por empresa
- **financial_entries** — tabela central de lançamentos (entry_date, competence_month, business_unit, movement_account, movement_description, counterparty_name, amount_in, amount_out, entry_type, source_type, source_file_name, source_sheet_name, bank_account_id, conciliation_status, document_reference, etc.)
- **bank_statement_entries** — extratos importados (transaction_date, description, amount, direction, raw_payload, import_batch_id, conciliation_status, etc.)
- **conciliation_matches** — matches entre extrato e lançamentos (match_score, match_type, status, confirmed_by)
- **import_batches** — controle de importações (file_name, source_kind, status, error_log)
- **clients** — cadastro de clientes
- **devis** — orçamentos/propostas (status: rascunho, enviado, aprovado, rejeitado, convertido)
- **services** — serviços/processos operacionais
- **user_roles** — roles (admin, financeiro, comercial, operacao, gestao, bi_viewer)
- **profiles** — perfis de usuário
- **audit_logs** — logs de ações

### RLS básica por perfil com security definer functions

## 3. Autenticação
- Login com email/senha via Supabase Auth
- Tabela user_roles separada com roles definidos
- Proteção de rotas no frontend por role (enforcement completo virá depois)

## 4. Dashboard
- Cards de indicadores: total a receber, total a pagar, saldo, pendentes de conciliação
- Atalhos rápidos para Conciliação, Movimentação Financeira, Clientes
- Gráfico simples de receitas vs despesas por mês

## 5. Módulo Financeiro — Página "Movimentação Financeira"
- Filtros: competência, negócio, conta movimentação, fornecedor/cliente, entrada/saída
- Tabela com colunas: Data, Negócio, Conta Movimentação, Descrição, Fornecedor/Cliente, Entrada, Saída, Status Conciliação, Origem
- Paginação, ordenação, busca textual
- Exportação CSV/XLSX
- Formulário para lançamento manual
- Visão por competência mensal

## 6. Conciliação Bancária (Módulo Prioritário)
- **Upload de extrato**: suporte a CSV/XLSX/OFX, armazenamento do extrato bruto
- **Tabela de extrato importado** com filtros
- **Tabela de lançamentos internos** lado a lado
- **Motor de sugestões**: match automático por valor + data + descrição, com score de confiança
- **Área de sugestões de match**: confirmar, rejeitar ou conciliar manualmente
- **Cards de resumo**: conciliado, pendente, divergente, entradas, saídas, saldo
- **Filtros**: período, conta bancária, status, empresa
- **Trilha de auditoria** para cada conciliação

## 7. Importação de Planilha Histórica
- Upload de arquivo XLSX com abas mensais (Jan25, Fev25, Mar25...)
- Reconhecimento automático de competência pela aba
- Validação de estrutura de colunas
- Controle de duplicidade e reimportação
- Relatório de importação (sucesso, erros, linhas importadas)
- Rastreabilidade do nome da aba de origem
- Dados aparecem na Movimentação Financeira e na Conciliação

## 8. Módulos Estruturais (estado inicial)
### Comercial
- CRUD de clientes
- CRUD de devis com status (rascunho → enviado → aprovado → rejeitado → convertido)
- Ao aprovar: flag/evento preparado para gatilho de cobrança 50%

### Operação
- CRUD de serviços/processos com status operacional
- Datas e conclusão
- Ao concluir: flag/evento preparado para gatilho de cobrança final 50%

### Gestão/Administrativo
- Página com visão transversal (placeholder funcional)
- Seletor de empresa/bloco

### Consolidação/BI
- Página com indicadores consolidados (placeholder)
- Cards de receita x despesa por empresa

### Administração
- Listagem de usuários e roles
- Logs de auditoria

## 9. Edge Functions (API para BI)
- `GET /financial-entries` — com filtros (competence, business_unit, period, status)
- `GET /bank-statements` — extratos importados
- `GET /conciliations` — matches de conciliação
- `GET /dashboard/financial-summary` — resumo financeiro
- `GET /business-units` — empresas
- Autenticação via API key
- Respostas JSON prontas para Power BI/Metabase

## 10. Ordem de Implementação
1. Setup do banco de dados (todas as tabelas, roles, RLS)
2. Auth + layout base com sidebar e rotas
3. Dashboard com cards
4. Movimentação Financeira (tabela, filtros, CRUD)
5. Importação de planilha histórica
6. Conciliação Bancária (upload, sugestões, match)
7. Módulos Comercial, Operação, Gestão (estrutura inicial)
8. Administração (usuários, roles, logs)
9. Edge Functions para API BI
10. Consolidação/BI page
