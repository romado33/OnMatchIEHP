import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { seedDemoAccounts, DEMO_CREDENTIALS } from "@/lib/seed-demo.functions";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Sparkles, Stethoscope, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo accounts — OnMatchIEHP" }] }),
  component: DemoPage,
});

function DemoPage() {
  const seed = useServerFn(seedDemoAccounts);
  const [seeding, setSeeding] = useState(false);
  const [ready, setReady] = useState(false);

  async function setupDemo() {
    setSeeding(true);
    try {
      await seed();
      setReady(true);
      toast.success("Demo accounts are ready — sign in with either set of credentials below.");
    } catch (e) {
      toast.error("Failed to set up demo data. Try again.");
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
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
          Spin up two ready-made accounts — one IEHP (job seeker) and one HR / employer — pre-loaded with sample
          profile and job data. Everything is clearly marked <span className="font-mono text-xs">[DEMO]</span> so
          it's easy to tell apart from real users.
        </p>

        <div className="mt-6">
          <Button onClick={setupDemo} disabled={seeding} size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            {seeding ? "Setting up…" : ready ? "Re-run demo setup" : "Set up demo accounts"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Safe to run multiple times — it only creates what's missing.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <AccountCard
            icon={<Stethoscope className="h-5 w-5 text-emerald-600" />}
            title="IEHP candidate"
            subtitle="Priya Sharma — ICU nurse trained in India"
            email={DEMO_CREDENTIALS.iehp.email}
            password={DEMO_CREDENTIALS.iehp.password}
            onCopy={copy}
          />
          <AccountCard
            icon={<Building2 className="h-5 w-5 text-sky-600" />}
            title="HR / Employer"
            subtitle="Lakeshore Regional Health (verified)"
            email={DEMO_CREDENTIALS.hr.email}
            password={DEMO_CREDENTIALS.hr.password}
            onCopy={copy}
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

        <p className="mt-6 text-xs text-muted-foreground">
          Sign out from the header to switch between the two demo accounts.
        </p>
      </main>
    </div>
  );
}

function AccountCard({
  icon,
  title,
  subtitle,
  email,
  password,
  onCopy,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  email: string;
  password: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <CredRow label="Email" value={email} onCopy={() => onCopy(email, "Email")} />
        <CredRow label="Password" value={password} onCopy={() => onCopy(password, "Password")} />
      </CardContent>
    </Card>
  );
}

function CredRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={onCopy} className="h-7 w-7 shrink-0">
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}