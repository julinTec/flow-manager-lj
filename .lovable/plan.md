

# Plano: Substituir logo pelo SVG Lundgaard Jensen

## Resumo
Copiar o SVG enviado para `src/assets/logo.svg` e usá-lo na tela de login e na sidebar, substituindo o ícone genérico `Building2`.

## Alterações

### 1. Copiar o arquivo
- `user-uploads://logo-svg-lundgaard-jensen.svg` → `src/assets/logo.svg`

### 2. Tela de Login (`src/pages/Auth.tsx`)
- Remover o ícone `Building2` dentro do quadrado azul
- Importar o SVG como componente e exibir a logo centralizada (largura ~200px)
- Trocar o título "Sistema de Gestão" por "Lundgaard Hub"
- Manter subtítulo "Faça login"

### 3. Sidebar (`src/components/AppSidebar.tsx`)
- Importar o SVG da logo
- No header da sidebar:
  - **Expandida**: exibir a logo com largura adequada (~140px), remover o quadrado azul com ícone e o texto "Gestão ERP / v1.0"
  - **Colapsada**: exibir apenas as iniciais "LJ" em um quadrado pequeno (mantendo o estilo atual do container 9x9)

