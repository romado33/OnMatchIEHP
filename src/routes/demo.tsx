import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { seedDemoAccounts, DEMO_CREDENTIALS } from "@/lib/seed-demo.functions";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Stethoscope, Building2, LogIn } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo accounts — OnMatchIEHP" }] }),
  component: DemoPage,
});

function DemoPage() {
  const seed = useServerFn(seedDemoAccounts);
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState<"iehp" | "hr" | null>(null);

  async function setupAndSignIn(role: "iehp" | "hr") {
    setSigningIn(role);
    try {
      // Seed accounts if not already done
      if (!ready) {
        setSeeding(true);
        await seed();
        setReady(true);
        setSeeding(false);
      }

      const creds = DEMO_CREDENTIALS[role];
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (error) {
        toast.error("Sign-in failed. Try clicking the button again.");
        console.error(error);
        return;
      }

      toast.success(`Signed in as ${role === "iehp" ? "Priya (IEHP candidate)" : "Alex (HR employer)"}`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error("Something went wrong. Try again.");
      console.error(e);
    } finally {
      setSigningIn(null);
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
          Demo mode
        </Badge>
        <h1 className="mt-3 text-3xl font-bold">Try both sides of OnMatchIEHP</h1>
        <p className="mt-2 text-muted-foreground">
          One click to sign in as either a health professional or an employer. Accounts are
          pre-loaded with sample data — everything is marked{" "}
          <span className="font-mono text-xs">[DEMO]</span> so it's easy to tell apart from real
          users.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <DemoCard
            icon={<Stethoscope className="h-5 w-5 text-emerald-600" />}
            title="IEHP Candidate"
            subtitle="Priya Sharma — ICU nurse trained in India"
            description="See the professional experience: build a profile, track credential steps, browse job postings, and get AI-matched."
            buttonLabel="Sign in as Priya"
            loading={signingIn === "iehp"}
            disabled={signingIn !== null}
            onSignIn={() => setupAndSignIn("iehp")}
          />
          <DemoCard
            icon={<Building2 className="h-5 w-5 text-sky-600" />}
            title="HR / Employer"
            subtitle="Lakeshore Regional Health (verified)"
            description="See the employer experience: run AI candidate searches, post jobs, shortlist candidates, and send messages."
            buttonLabel="Sign in as Alex (HR)"
            loading={signingIn === "hr"}
            disabled={signingIn !== null}
            onSignIn={() => setupAndSignIn("hr")}
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">What's pre-loaded</CardTitle>
            <CardDescription>All marked [DEMO] so it never gets confused with real data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• IEHP profile with profession, specialty, languages, credentials status, and availability.</p>
            <p>• Verified employer organization profile, so candidate search is immediately usable.</p>
            <p>• One active ICU RN job posting you can run AI matching against.</p>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground">
          Sign out from the header to switch between the two demo accounts.
        </p>

        {/* Re-seed option */}
        <div className="mt-6 border-t border-border pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setSeeding(true);
              try {
                await seed();
                setReady(true);
                toast.success("Demo data refreshed.");
              } catch {
                toast.error("Failed to refresh demo data.");
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding || signingIn !== null}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {seeding ? "Refreshing…" : "Refresh demo data"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function DemoCard({
  icon,
  title,
  subtitle,
  description,
  buttonLabel,
  loading,
  disabled,
  onSignIn,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  buttonLabel: string;
  loading: boolean;
  disabled: boolean;
  onSignIn: () => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button onClick={onSignIn} disabled={disabled} className="w-full gap-2">
          <LogIn className="h-4 w-4" />
          {loading ? "Signing in…" : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
