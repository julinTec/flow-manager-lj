
## Plano: corrigir a “página branca” na abertura inicial

## Diagnóstico
O app não está quebrando de fato: ao abrir a rota `/`, ele entra primeiro em uma rota protegida (`ProtectedRoute`). Como o usuário não está autenticado, o fluxo atual faz:

1. abrir `/`
2. esperar o `AuthContext` inicializar
3. só depois redirecionar para `/auth`

Nesse intervalo, a tela mostra apenas um loading muito discreto, parecendo uma página totalmente em branco. No navegador, a tela final correta é a de login em `/auth`.

Também há um warning de `ref` no menu lateral (`NavLink`), que não parece ser a causa principal da tela branca, mas vale corrigir para evitar comportamento estranho no layout.

## O que será ajustado

### 1. Tornar a inicialização de autenticação mais robusta
Arquivo: `src/contexts/AuthContext.tsx`

- Colocar a leitura inicial de sessão dentro de `try/catch/finally`
- Garantir que `loading` sempre saia de `true`, mesmo se houver erro na leitura da sessão
- Não deixar falha em busca de papel/permissão interferir na renderização inicial
- Separar claramente:
  - estado de sessão autenticada
  - estado de role/perfil

Objetivo: impedir qualquer cenário em que a app fique presa numa abertura “vazia”.

### 2. Melhorar o comportamento da rota inicial
Arquivo: `src/App.tsx`

- Ajustar o fluxo da rota inicial para que usuário sem sessão vá de forma previsível para `/auth`
- Evitar depender de um loading genérico invisível enquanto a sessão resolve
- Manter a proteção das páginas internas normalmente

Objetivo: ao abrir o projeto deslogado, o usuário deve ver a tela de login de forma clara e imediata.

### 3. Substituir a tela branca por um loading visual
Arquivo: `src/App.tsx` (ou componente pequeno dedicado)

- Trocar o `<div>Carregando...</div>` por uma tela de carregamento centralizada, com identidade visual do sistema
- Fundo, logo e texto visíveis para não parecer erro ou página vazia

Objetivo: mesmo quando houver alguns milissegundos de inicialização, o usuário vê uma tela intencional, não um branco “sem resposta”.

### 4. Corrigir warning do menu lateral
Arquivo: `src/components/NavLink.tsx`

- Ajustar o wrapper de `NavLink` para não receber `ref` de forma incompatível com o uso em `SidebarMenuButton asChild`
- Manter o mesmo comportamento visual e de navegação

Objetivo: limpar warnings de renderização e evitar efeitos colaterais no layout.

## Resultado esperado
Ao abrir o sistema:
- se estiver deslogado, a tela de login aparece corretamente
- não haverá mais sensação de “página branca inicial”
- a autenticação fica mais resiliente a falhas
- o warning do menu lateral deixa de poluir o console

## Arquivos a alterar
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `src/components/NavLink.tsx`

## Ordem de execução
1. Robustecer bootstrap do `AuthContext`
2. Ajustar rota inicial e loaders em `App.tsx`
3. Corrigir `NavLink`/sidebar refs
4. Validar fluxo: abrir `/` deslogado → ir para `/auth` com tela visível
