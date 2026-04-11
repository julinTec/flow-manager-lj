import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Users, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

function StatCard({ title, value, icon: Icon, description, color = "primary", onClick }: {
  title: string; value: string; icon: any; description?: string; color?: string; onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: financialStats } = useQuery({
    queryKey: ["dashboard-financial"],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_entries")
        .select("amount_in, amount_out, conciliation_status");
      if (!data) return { totalIn: 0, totalOut: 0, pending: 0 };
      const totalIn = data.reduce((s, e) => s + Number(e.amount_in || 0), 0);
      const totalOut = data.reduce((s, e) => s + Number(e.amount_out || 0), 0);
      const pending = data.filter((e) => e.conciliation_status === "pendente").length;
      return { totalIn, totalOut, pending };
    },
  });

  const { data: clientCount } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: devisCount } = useQuery({
    queryKey: ["dashboard-devis"],
    queryFn: async () => {
      const { count } = await supabase.from("devis").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  const stats = financialStats ?? { totalIn: 0, totalOut: 0, pending: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do grupo empresarial</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Entradas"
          value={fmt(stats.totalIn)}
          icon={ArrowDownCircle}
          description="Receitas registradas"
          onClick={() => navigate("/financeiro")}
        />
        <StatCard
          title="Total Saídas"
          value={fmt(stats.totalOut)}
          icon={ArrowUpCircle}
          description="Despesas registradas"
          onClick={() => navigate("/financeiro")}
        />
        <StatCard
          title="Saldo"
          value={fmt(stats.totalIn - stats.totalOut)}
          icon={TrendingUp}
          description="Entradas - Saídas"
        />
        <StatCard
          title="Pendentes Conciliação"
          value={String(stats.pending)}
          icon={ArrowLeftRight}
          description="Lançamentos a conciliar"
          onClick={() => navigate("/conciliacao")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Clientes"
          value={String(clientCount ?? 0)}
          icon={Users}
          description="Clientes cadastrados"
          onClick={() => navigate("/comercial")}
        />
        <StatCard
          title="Orçamentos"
          value={String(devisCount ?? 0)}
          icon={FileText}
          description="Devis/propostas"
          onClick={() => navigate("/comercial")}
        />
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/financeiro")}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button onClick={(e) => { e.stopPropagation(); navigate("/financeiro"); }} className="block w-full text-left text-sm text-primary hover:underline">
              → Movimentação Financeira
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate("/conciliacao"); }} className="block w-full text-left text-sm text-primary hover:underline">
              → Conciliação Bancária
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate("/comercial"); }} className="block w-full text-left text-sm text-primary hover:underline">
              → Clientes e Orçamentos
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
