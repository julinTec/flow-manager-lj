import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Save, X, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { ALL_STATUSES, STATUS_LABELS as statusLabels, STATUS_BADGE_CLASSES as devisStatusColors } from "@/lib/devisStatus";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

export default function DevisDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  const { data: devis, isLoading } = useQuery({
    queryKey: ["devis", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("devis").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("name")).data ?? [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, full_name, email").order("full_name")).data ?? [],
  });

  const clientsById = useMemo(() => Object.fromEntries(clients.map((c: any) => [c.id, c])), [clients]);
  const profilesById = useMemo(() => Object.fromEntries(profiles.map((p: any) => [p.user_id, p])), [profiles]);

  useEffect(() => {
    if (devis) {
      setForm({
        ...devis,
        meeting_date: devis.meeting_date ? parseISO(devis.meeting_date) : undefined,
        total_amount: String(devis.total_amount ?? ""),
        down_payment_amount: String(devis.down_payment_amount ?? ""),
      });
    }
  }, [devis]);

  const update = useMutation({
    mutationFn: async () => {
      const payload = {
        client_id: form.client_id || null,
        meeting_date: form.meeting_date ? format(form.meeting_date, "yyyy-MM-dd") : null,
        commercial_responsible: form.commercial_responsible || null,
        meeting_summary: form.meeting_summary || null,
        status: form.status,
        total_amount: Number(form.total_amount) || 0,
        down_payment_amount: Number(form.down_payment_amount) || 0,
        notes: form.notes || null,
        title: form.title,
      };
      const { error } = await supabase.from("devis").update(payload).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Devis atualizado!");
      queryClient.invalidateQueries({ queryKey: ["devis"] });
      queryClient.invalidateQueries({ queryKey: ["devis", id] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !form) return <div className="text-muted-foreground">Carregando...</div>;
  if (!devis) return <div className="text-muted-foreground">Devis não encontrado.</div>;

  const client = clientsById[devis.client_id];
  const responsavel = profilesById[devis.commercial_responsible];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/comercial")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">{devis.title}</h1>
            <p className="text-muted-foreground mt-1">Detalhes do devis</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setForm({ ...devis, meeting_date: devis.meeting_date ? parseISO(devis.meeting_date) : undefined, total_amount: String(devis.total_amount ?? ""), down_payment_amount: String(devis.down_payment_amount ?? "") }); }}>
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
              <Button onClick={() => update.mutate()} disabled={update.isPending}>
                <Save className="h-4 w-4 mr-2" /> Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Editar</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
            {editing ? (
              <Select value={form.client_id ?? ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : <p className="font-medium mt-1">{client?.name || "—"}</p>}
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            {editing ? (
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : <div className="mt-1"><Badge variant="outline" className={devisStatusColors[devis.status] || ""}>{statusLabels[devis.status] || devis.status}</Badge></div>}
          </div>

          {/* Data Reunião */}
          <div>
            <Label>Data da reunião</Label>
            {editing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal", !form.meeting_date && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {form.meeting_date ? format(form.meeting_date, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.meeting_date} onSelect={(d) => setForm({ ...form, meeting_date: d })} initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
            ) : <p className="font-medium mt-1">{devis.meeting_date ? format(parseISO(devis.meeting_date), "dd/MM/yyyy") : "—"}</p>}
          </div>

          {/* Responsável */}
          <div>
            <Label>Responsável comercial</Label>
            {editing ? (
              <Select value={form.commercial_responsible ?? ""} onValueChange={(v) => setForm({ ...form, commercial_responsible: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{profiles.map((p: any) => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>)}</SelectContent>
              </Select>
            ) : <p className="font-medium mt-1">{responsavel?.full_name || responsavel?.email || "—"}</p>}
          </div>

          {/* Valor Total */}
          <div>
            <Label>Valor total</Label>
            {editing ? (
              <Input type="number" step="0.01" value={form.total_amount} onChange={(e) => {
                const total = e.target.value;
                setForm({ ...form, total_amount: total, down_payment_amount: total === "" ? "" : String((Number(total) * 0.5).toFixed(2)) });
              }} />
            ) : <p className="font-medium mt-1 text-lg">{fmtBRL(devis.total_amount)}</p>}
          </div>

          {/* Entrada */}
          <div>
            <Label>Valor de entrada</Label>
            {editing ? (
              <Input type="number" step="0.01" value={form.down_payment_amount} onChange={(e) => setForm({ ...form, down_payment_amount: e.target.value })} />
            ) : <p className="font-medium mt-1 text-lg">{fmtBRL(devis.down_payment_amount)}</p>}
          </div>

          {/* Título */}
          <div className="md:col-span-2">
            <Label>Título</Label>
            {editing ? (
              <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            ) : <p className="font-medium mt-1">{devis.title}</p>}
          </div>

          {/* Resumo */}
          <div className="md:col-span-2">
            <Label>Resumo da reunião</Label>
            {editing ? (
              <Textarea rows={4} value={form.meeting_summary ?? ""} onChange={(e) => setForm({ ...form, meeting_summary: e.target.value })} />
            ) : <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{devis.meeting_summary || "—"}</p>}
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <Label>Observações</Label>
            {editing ? (
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            ) : <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{devis.notes || "—"}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
