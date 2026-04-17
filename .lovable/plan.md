
# Plano: Substituir Dashboard por Hub de Módulos (cards clicáveis)

## Resumo
Trocar a página `/` (atualmente `Dashboard.tsx` com KPIs) por um **Hub central** estilo grid de cards coloridos — cada card representa um módulo do sistema e leva para a respectiva rota. KPIs ficam por conta da página `/bi` (já existente).

## Referência visual
Imagem do Hub SEFIN: grid responsivo de cards com gradiente sólido por cor, ícone branco grande no topo, título em destaque, subtítulo descritivo. Hover suave com leve elevação.

## 1. Nova página `src/pages/Hub.tsx`
Grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) com cabeçalho:
- Título: **"Lundgaard Hub"**
- Subtítulo: **"Sistema Central de Gestão Empresarial"**

Cards (um por módulo, baseados no `AppSidebar` e rotas em `App.tsx`):

| Card | Rota | Ícone (lucide) | Cor (gradiente) |
|---|---|---|---|
| Financeiro — Movimentação e fluxo de caixa | `/financeiro` | `DollarSign` | azul |
| Conciliação — Conciliação bancária | `/conciliacao` | `ArrowLeftRight` | teal |
| Comercial — Clientes e propostas (Devis) | `/comercial` | `FileText` | roxo |
| Operação — Cases e serviços | `/operacao` | `Briefcase` | verde-escuro |
| Gestão — Indicadores e gestão | `/gestao` | `LayoutDashboard` | laranja |
| BI — Business Intelligence | `/bi` | `BarChart3` | rosa |
| Admin — Usuários e permissões | `/admin` | `Shield` | cinza-azulado (só para admin) |

Filtragem do card **Admin** via `useAuth().userRole === 'admin'`.

## 2. Componente `ModuleCard`
Inline na própria página (simples, sem novo arquivo):
- `Card` com `bg-gradient-to-br` da cor do módulo, `text-white`, `cursor-pointer`
- Ícone 48px branco no topo
- Título grande (font-display) + descrição em opacity-90
- `hover:shadow-lg hover:-translate-y-0.5 transition-all`
- `onClick` → `navigate(route)`
- Aspect ratio quadrado-ish via `min-h-[180px]`

## 3. Roteamento
- `src/App.tsx`: trocar `<Route index element={<Dashboard />} />` por `<Route index element={<Hub />} />`.
- Remover import de `Dashboard`.
- Excluir `src/pages/Dashboard.tsx` (KPIs já presentes no módulo BI/Gestão).

## 4. Sidebar
- `AppSidebar.tsx`: renomear o item "Dashboard" para **"Início"** (ou **"Hub"**) apontando para `/`, mantendo o ícone `Home`. Manter o item BI separado.

## 5. Detalhes
- Cores via classes Tailwind diretas com gradiente (`from-blue-500 to-blue-700` etc.) para fidelidade ao visual de referência — sem mexer em design tokens do tema.
- 100% responsivo (mobile: 1 coluna; desktop: 4 colunas).
- Sem dependências novas, sem mudanças de banco.

## Ordem de execução
1. Criar `src/pages/Hub.tsx` com grid de cards.
2. Atualizar `src/App.tsx` (rota index → Hub, remover import Dashboard).
3. Renomear item da sidebar para "Início".
4. Excluir `src/pages/Dashboard.tsx`.
