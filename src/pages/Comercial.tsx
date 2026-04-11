import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Users, FileText, Search } from "lucide-react";

const devisStatusColors: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-primary/20 text-primary border-primary/30",
  aprovado: "bg-success/20 text-success border-success/30",
  rejeitado: "bg-destructive/20 text-destructive border-destructive/30",
  convertido: "bg-warning/20 text-warning border-warning/30",
};

export default function Comercial() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [devisDialogOpen, setDevisDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "", document: "", address: "", city: "" });
  const [devisForm, setDevisForm] = useState({ title: "", description: "", total_amount: "", business_unit: "", client_id: "" });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => { const { data } = await supabase.from("clients").select("*").order("name"); return data ?? []; },
  });

  const { data: devisList = [] } = useQuery({
    queryKey: ["devis"],
    queryFn: async () => { const { data } = await supabase.from("devis").select("*").order("created_at", { ascending: false }); return data ?? []; },
  });

  const createClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert(clientForm);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cliente criado!"); queryClient.invalidateQueries({ queryKey: ["clients"] }); setClientDialogOpen(false); setClientForm({ name: "", email: "", phone: "", document: "", address: "", city: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const createDevis = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("devis").insert({
        ...devisForm,
        total_amount: Number(devisForm.total_amount) || 0,
        client_id: devisForm.client_id || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Orçamento criado!"); queryClient.invalidateQueries({ queryKey: ["devis"] }); setDevisDialogOpen(false); setDevisForm({ title: "", description: "", total_amount: "", business_unit: "", client_id: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateDevisStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "aprovado") updates.approved_at = new Date().toISOString();
      const { error } = await supabase.from("devis").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status atualizado!"); queryClient.invalidateQueries({ queryKey: ["devis"] }); },
  });

  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Comercial</h1>
        <p className="text-muted-foreground mt-1">Clientes e orçamentos</p>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-2" />Clientes</TabsTrigger>
          <TabsTrigger value="devis"><FileText className="h-4 w-4 mr-2" />Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Nome *" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
                  <Input placeholder="Email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
                  <Input placeholder="Telefone" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
                  <Input placeholder="Documento (CPF/CNPJ)" value={clientForm.document} onChange={(e) => setClientForm({ ...clientForm, document: e.target.value })} />
                  <Input placeholder="Endereço" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} />
                  <Input placeholder="Cidade" value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} />
                  <Button className="w-full" onClick={() => createClient.mutate()} disabled={!clientForm.name}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead>Documento</TableHead><TableHead>Cidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado</TableCell></TableRow>
                ) : clients.map((c) => (
                  <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.email}</TableCell><TableCell>{c.phone}</TableCell><TableCell>{c.document}</TableCell><TableCell>{c.city}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="devis" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={devisDialogOpen} onOpenChange={setDevisDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Orçamento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Título *" value={devisForm.title} onChange={(e) => setDevisForm({ ...devisForm, title: e.target.value })} />
                  <Input placeholder="Descrição" value={devisForm.description} onChange={(e) => setDevisForm({ ...devisForm, description: e.target.value })} />
                  <Input type="number" placeholder="Valor Total (R$)" value={devisForm.total_amount} onChange={(e) => setDevisForm({ ...devisForm, total_amount: e.target.value })} />
                  <Input placeholder="Negócio" value={devisForm.business_unit} onChange={(e) => setDevisForm({ ...devisForm, business_unit: e.target.value })} />
                  <Select value={devisForm.client_id} onValueChange={(v) => setDevisForm({ ...devisForm, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="w-full" onClick={() => createDevis.mutate()} disabled={!devisForm.title}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead><TableHead>Negócio</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devisList.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum orçamento cadastrado</TableCell></TableRow>
                ) : devisList.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{d.business_unit}</TableCell>
                    <TableCell className="text-right">{fmt(Number(d.total_amount))}</TableCell>
                    <TableCell><Badge variant="outline" className={devisStatusColors[d.status] || ""}>{d.status}</Badge></TableCell>
                    <TableCell>
                      <Select value="" onValueChange={(v) => updateDevisStatus.mutate({ id: d.id, status: v })}>
                        <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Alterar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                          <SelectItem value="convertido">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
