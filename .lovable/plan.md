
# Plano: Corrigir tela em branco no login

## Diagnóstico
O build está falhando devido a erro TypeScript na edge function `supabase/functions/manage-users/index.ts` (linha 168): `'err' is of type 'unknown'`. Esse erro de type-check derruba o build e por isso a tela aparece em branco.

## Correção
**`supabase/functions/manage-users/index.ts`** (linha 167-172): tratar `err` como `unknown` no `catch`, extraindo a mensagem de forma segura:

```ts
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

## Detalhes
- Sem mudanças de schema, sem novas dependências.
- Após a correção, o build do projeto volta e a tela de login (`/auth`) renderiza normalmente.
- O arquivo `src/debug.tsx` apenas declara `console.log` no escopo do módulo e não é importado em lugar algum — não causa problema, mas pode ser limpo numa próxima passada.
