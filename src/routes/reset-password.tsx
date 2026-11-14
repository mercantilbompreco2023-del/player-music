import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Player Music" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — Player Music" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setOk(true);
    const { data } = supabase.auth.onAuthStateChange((e) => e === "PASSWORD_RECOVERY" && setOk(true));
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-bold">Nova senha</h1>
      {!ok ? (
        <p className="text-sm text-muted-foreground">Abra esta página pelo link de recuperação enviado para o seu e-mail.</p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.length < 8) { toast.error("A senha precisa ter pelo menos 8 caracteres."); return; }
            setBusy(true);
            const { error } = await supabase.auth.updateUser({ password: pw });
            setBusy(false);
            if (error) { toast.error("Não foi possível trocar a senha. Peça um novo link."); return; }
            toast.success("Senha alterada.");
            navigate({ to: "/" });
          }}
        >
          <Label htmlFor="pw">Nova senha</Label>
          <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button type="submit" className="w-full rounded-full" disabled={busy}>Salvar nova senha</Button>
        </form>
      )}
    </div>
  );
}
