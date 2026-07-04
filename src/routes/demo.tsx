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
  head: () => ({ meta: [{ title: "Demo accounts — Ontario IEHP Workforce Integration Registry" }] }),
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
    const creds = DEMO_CREDENTIALS[role];
    const label = role === "iehp" ? "Priya (IEHP candidate)" : "Alex (HR employer)";

    try {
      // Step 1: try signing in directly (accounts may already exist)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (!signInError) {
        toast.success(`Signed in as ${label}`);
        navigate({ to: "/dashboard" });
        return;
      }

      // Step 2: sign-in failed — try seeding first, then sign in again
      setSeeding(true);
      await seed();
      setReady(true);
      setSeeding(false);

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (retryError) {
        toast.error("Demo accounts created but sign-in failed. Check that email confirmations are disabled in Supabase Auth settings.");
        return;
      }

      toast.success(`Signed in as ${label}`);
      navigate({ to: "/dashboard" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("SERVICE_ROLE") || msg.includes("service_role") || msg.includes("environment variable")) {
        toast.error("Demo setup needs the SUPABASE_SERVICE_ROLE_KEY added to Vercel environment variables.", { duration: 8000 });
      } else {
        toast.error(`Sign-in failed: ${msg}`);
      }
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
        <h1 className="mt-3 text-3xl font-bold">Try both sides of Ontario IEHP Workforce Integration Registry</h1>
        <p className="mt-2 text-muted-foreground">
          One click to sign in as either a health professional or an employer. Accounts are
          pre-loaded with sample data — everything is marked{" "}
          <span className="font-mono text-xs">[DEMO]</span> so it's easy to tell apart from real
          users.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <DemoCard
            image="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&h=260&fit=crop&crop=center"
            imageAlt="Indian woman healthcare professional"
            icon={<Stethoscope className="h-5 w-5 text-primary" />}
            title="IEHP Candidate"
            subtitle="Priya Sharma — ICU nurse trained in India"
            description="See the professional experience: build a profile, track credential steps, browse job postings, and get AI-matched."
            buttonLabel="Sign in as Priya"
            loading={signingIn === "iehp"}
            disabled={signingIn !== null}
            onSignIn={() => setupAndSignIn("iehp")}
          />
          <DemoCard
            image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=240&fit=crop&crop=top"
            imageAlt="Diverse HR team including women in a meeting"
            icon={<Building2 className="h-5 w-5 text-primary" />}
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
  image,
  imageAlt,
  icon,
  title,
  subtitle,
  description,
  buttonLabel,
  loading,
  disabled,
  onSignIn,
}: {
  image: string;
  imageAlt: string;
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
    <Card className="flex flex-col overflow-hidden p-0">
      <img src={image} alt={imageAlt} className="w-full h-48 object-cover" />
      <CardHeader className="pt-5">
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
