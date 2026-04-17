import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token || !UUID_RE.test(token)) {
      return json({ error: "Token inválido" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Busca o devis pelo token + nome do cliente
    const { data: devis, error: fetchErr } = await supabase
      .from("devis")
      .select(
        "id, title, total_amount, down_payment_amount, deadline_date, scope_description, proposal_structure, accepted_at, status, sent_at, client_id",
      )
      .eq("accept_token", token)
      .maybeSingle();

    if (fetchErr) {
      console.error("fetch error", fetchErr);
      return json({ error: "Erro ao buscar proposta" }, 500);
    }
    if (!devis) return json({ error: "Proposta não encontrada" }, 404);

    let clientName: string | null = null;
    if (devis.client_id) {
      const { data: c } = await supabase
        .from("clients")
        .select("name")
        .eq("id", devis.client_id)
        .maybeSingle();
      clientName = c?.name ?? null;
    }

    const preview = {
      title: devis.title,
      client_name: clientName,
      total_amount: devis.total_amount,
      down_payment_amount: devis.down_payment_amount,
      deadline_date: devis.deadline_date,
      scope_description: devis.scope_description,
      proposal_structure: devis.proposal_structure,
      accepted_at: devis.accepted_at,
    };

    if (req.method === "GET") return json(preview);

    if (req.method === "POST") {
      // Idempotente
      if (devis.accepted_at) {
        return json({ ...preview, already_accepted: true });
      }

      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        null;

      const { data: updated, error: upErr } = await supabase
        .from("devis")
        .update({
          accepted_at: new Date().toISOString(),
          accepted_ip: ip,
          status: "aceita",
        })
        .eq("id", devis.id)
        .select("accepted_at")
        .maybeSingle();

      if (upErr) {
        console.error("update error", upErr);
        return json({ error: "Não foi possível registrar o aceite" }, 500);
      }

      return json({ ...preview, accepted_at: updated?.accepted_at });
    }

    return json({ error: "Método não suportado" }, 405);
  } catch (e) {
    console.error("unexpected", e);
    return json({ error: "Erro interno" }, 500);
  }
});
