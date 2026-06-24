import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search, UserCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("account_type, full_name").eq("id", user.id).maybeSingle();
      setAccountType(data?.account_type ?? null);
      setName(data?.full_name ?? user.email ?? "");
      if (!data?.account_type) navigate({ to: "/onboarding" });
    })();
  }, [navigate]);

  if (accountType === undefined) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Welcome{name ? `, ${name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-2 text-muted-foreground">
          {accountType === "professional"
            ? "Keep your profile up to date so employers can find you."
            : "Describe a role in plain English and we'll surface the best-matching candidates."}
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {accountType === "professional" ? (
            <>
              <ActionCard icon={<UserCog className="h-5 w-5" />} title="My profile" body="Add credentials, languages, location, and availability." to="/profile" cta="Edit profile" />
              <ActionCard icon={<Stethoscope className="h-5 w-5" />} title="How matching works" body="Employers describe a role; our AI ranks candidates whose profile is set to searchable." to="/profile" cta="Make sure I'm searchable" />
            </>
          ) : (
            <>
              <ActionCard icon={<Search className="h-5 w-5" />} title="Find candidates" body="Describe the role and let AI rank the best-matching professionals." to="/search" cta="Start a search" />
              <ActionCard icon={<UserCog className="h-5 w-5" />} title="Organization profile" body="Tell candidates who you are." to="/profile" cta="Edit org profile" />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ActionCard({ icon, title, body, to, cta }: { icon: React.ReactNode; title: string; body: string; to: string; cta: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <CardTitle className="mt-3">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={to}><Button>{cta}</Button></Link>
      </CardContent>
    </Card>
  );
}