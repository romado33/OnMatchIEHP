import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  async function pick(type: "professional" | "employer") {
    setLoading(type);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(null); return; }
    const { error: e1 } = await supabase.from("profiles").update({ account_type: type }).eq("id", user.id);
    const { error: e2 } = await supabase.from("user_roles").insert({ user_id: user.id, role: type });
    setLoading(null);
    if (e1 || (e2 && !`${e2.message}`.includes("duplicate"))) {
      toast.error(e1?.message || e2?.message || "Failed to save");
      return;
    }
    navigate({ to: "/profile" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-center text-3xl font-bold">Which best describes you?</h1>
        <p className="mb-8 text-center text-muted-foreground">You can only choose one account type.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice icon={<Stethoscope className="h-6 w-6" />} title="Health professional" body="I'm internationally trained and looking for opportunities in Ontario." loading={loading === "professional"} onClick={() => pick("professional")} />
          <Choice icon={<Building2 className="h-6 w-6" />} title="Healthcare employer" body="I'm hiring for a hospital, clinic, or care organization in Ontario." loading={loading === "employer"} onClick={() => pick("employer")} />
        </div>
      </div>
    </div>
  );
}

function Choice({ icon, title, body, loading, onClick }: { icon: React.ReactNode; title: string; body: string; loading: boolean; onClick: () => void }) {
  return (
    <Card className="cursor-pointer transition hover:border-primary" onClick={onClick}>
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={loading} className="w-full">{loading ? "Saving…" : "Continue"}</Button>
      </CardContent>
    </Card>
  );
}