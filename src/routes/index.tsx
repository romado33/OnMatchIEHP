import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Stethoscope, Search, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OnMatch Health — Ontario's match for foreign-trained health pros" },
      { name: "description", content: "OnMatch Health connects internationally-trained health professionals with Ontario employers using AI matching." },
      { property: "og:title", content: "OnMatch Health" },
      { property: "og:description", content: "AI-powered matching for foreign-trained health professionals and Ontario healthcare employers." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Stethoscope className="h-5 w-5 text-primary" />
            OnMatch Health
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" /> Built for Ontario, Canada
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Foreign-trained health pros, matched with Ontario employers.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            OnMatch Health turns your international training, credentials, and goals into AI-ranked
            matches for hospitals, clinics, and care organizations across Ontario.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth"><Button size="lg">I'm a health professional</Button></Link>
            <Link to="/auth"><Button size="lg" variant="outline">I'm hiring</Button></Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Feature icon={<Stethoscope className="h-5 w-5" />} title="Built around your training" body="Capture your specialty, country of training, licensing exam progress, and language strengths in one profile." />
          <Feature icon={<Search className="h-5 w-5" />} title="AI candidate matching" body="HR teams describe a role in plain English. We rank the most relevant candidates with rationale." />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="You control visibility" body="Toggle searchability anytime. Your profile is only shared with verified Ontario employers." />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} OnMatch Health
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
