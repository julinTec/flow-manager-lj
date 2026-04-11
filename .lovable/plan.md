

# Plano: Gestão de Usuários na Administração

## Resumo
Transformar a página de Administração para que o admin possa criar, editar e remover usuários. Remover a opção de auto-cadastro (signup) da tela de login. Simplificar os perfis para apenas dois: **admin** e **gerencial**. O perfil "admin" vê a página Administração; o perfil "gerencial" não.

## Alterações

### 1. Banco de Dados
- Criar uma Edge Function `manage-users` que usa a **service_role key** para:
  - **Criar usuário**: `supabase.auth.admin.createUser()` com email + senha + nome, depois inserir role na `user_roles`
  - **Deletar usuário**: `supabase.auth.admin.deleteUser()` + cascade remove profile e roles
  - **Atualizar role**: update na `user_roles`
- Atualizar o enum `app_role` via migração para conter apenas `admin` e `gerencial` (ou manter os existentes e usar apenas esses dois no UI)
- Atualizar o trigger `handle_new_user_role` para não atribuir `admin` automaticamente (já que o admin cria os usuários com o perfil desejado)

### 2. Edge Function `manage-users`
- Endpoint com ações: `create`, `update-role`, `delete`
- Valida que o chamador é admin (verifica JWT + has_role)
- Usa `SUPABASE_SERVICE_ROLE_KEY` para operações admin no auth

### 3. Página Auth (Login)
- Remover a opção de "Cadastre-se" e o formulário de signup
- Manter apenas login com email/senha

### 4. Página Admin
- Adicionar botão "Novo Usuário" que abre um dialog/modal com:
  - Nome completo, Email, Senha, Perfil (admin ou gerencial)
- Na tabela de usuários, adicionar coluna "Ações" com:
  - Botão editar (altera perfil)
  - Botão excluir (com confirmação)
- Cada linha mostra nome, email, perfil e ações

### 5. Sidebar — Controle de visibilidade
- Esconder o item "Administração" para usuários com perfil `gerencial`
- Buscar o role do usuário logado e filtrar o menu

### 6. Proteção de Rota
- No `App.tsx`, proteger a rota `/admin` para permitir apenas usuários com role `admin`

### 7. RLS — Perfis
- Atualizar RLS da tabela `profiles` para que admins possam ver todos os perfis (necessário para listar usuários)

## Ordem de execução
1. Migração DB (RLS profiles, ajuste trigger)
2. Edge Function `manage-users`
3. Atualizar Auth.tsx (remover signup)
4. Reescrever Admin.tsx (CRUD de usuários)
5. Atualizar Sidebar (esconder Admin para gerencial)
6. Proteger rota /admin

