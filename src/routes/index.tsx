import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope,
  Search,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Building2,
  FileText,
  GraduationCap,
  Users,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OnMatchIEHP — Ontario's match for internationally trained health professionals" },
      {
        name: "description",
        content:
          "OnMatchIEHP connects internationally trained health professionals with verified Ontario healthcare employers using AI-powered matching.",
      },
      { property: "og:title", content: "OnMatchIEHP" },
      {
        property: "og:description",
        content: "AI-powered matching for foreign-trained health professionals and Ontario healthcare employers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Stethoscope className="h-5 w-5 text-primary" />
            OnMatchIEHP
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3 w-3" /> Built for Ontario, Canada
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Foreign-trained health pros,
            <br />
            matched with Ontario employers.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            OnMatchIEHP turns your international training, credentials, and goals into AI-ranked
            matches for hospitals, clinics, and care organizations across Ontario. Free for
            internationally educated health professionals and for employers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                I'm a health professional <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                I'm hiring
              </Button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-4">
            <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />} text="Verified employers only" />
            <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />} text="We never share your immigration status" />
            <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />} text="PIPEDA-compliant" />
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<Stethoscope className="h-5 w-5" />}
            title="Built for your journey"
            body="Capture your specialty, country of training, licensing pathway progress, and language strengths in one profile."
          />
          <Feature
            icon={<Search className="h-5 w-5" />}
            title="AI candidate matching"
            body="HR teams describe a role in plain English. We rank the most relevant candidates with transparent AI rationale."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="You control visibility"
            body="Toggle searchability anytime. Your profile is only shared with verified Ontario employers — never your immigration status."
          />
        </div>
      </section>

      <Separator />

      {/* ── How it works: professionals ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <Badge variant="secondary" className="mb-1">For health professionals</Badge>
            <h2 className="text-3xl font-bold">Your path to Ontario healthcare</h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Step
            number="1"
            title="Build your profile"
            body="Enter your profession, country of training, credential progress, languages, and location preferences. The more you add, the better your matches."
          />
          <Step
            number="2"
            title="Track your credentials"
            body="Use our guided credential tracker to record each step of your Ontario licensing journey — from NNAS submission to your college certificate."
          />
          <Step
            number="3"
            title="Get matched"
            body="Verified Ontario employers use AI to find candidates like you. You'll be notified when there's a match — with full control over your visibility."
          />
        </div>
        <div className="mt-8">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Create your free profile <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Separator />

      {/* ── How it works: employers ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <Badge variant="secondary" className="mb-1">For healthcare employers</Badge>
            <h2 className="text-3xl font-bold">Find qualified candidates faster</h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Step
            number="1"
            title="Verify your organization"
            body="Create an account, complete your organization profile, and submit for verification. Typically approved within 1 business day."
          />
          <Step
            number="2"
            title="Post roles or search directly"
            body="Post job listings visible to all professionals, or use AI candidate search — describe a role in plain English and get ranked matches instantly."
          />
          <Step
            number="3"
            title="Connect and hire"
            body="Save candidates to shortlists, send direct messages, and manage your applicant pipeline. Compliance-conscious at every step."
          />
        </div>
        <div className="mt-8">
          <Link to="/auth">
            <Button size="lg" variant="outline" className="gap-2">
              Start hiring for free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Separator />

      {/* ── Compliance & trust section ───────────────────────────────────── */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold">Built with compliance in mind</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Healthcare hiring in Ontario involves real legal and ethical obligations. OnMatchIEHP is
            designed around them.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ComplianceItem
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Privacy-first by design"
              body="Immigration status is never disclosed to employers. We show only a simple 'work-authorized' indicator when the professional consents."
            />
            <ComplianceItem
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Employer verification"
              body="Every employer account is manually reviewed before gaining search access. Professionals are only visible to verified Ontario healthcare organizations."
            />
            <ComplianceItem
              icon={<FileText className="h-5 w-5" />}
              title="PIPEDA & Ontario privacy law"
              body="Data handling follows PIPEDA requirements. Users can access, correct, and delete their data at any time."
            />
            <ComplianceItem
              icon={<GraduationCap className="h-5 w-5" />}
              title="Regulatory body aware"
              body="Credential pathways are mapped to Ontario's actual regulatory colleges — CNO, CPSO, OCP, and 10+ others."
            />
            <ComplianceItem
              icon={<Users className="h-5 w-5" />}
              title="Human Rights Code aligned"
              body="The platform is designed to support, not circumvent, Ontario Human Rights Code obligations in the hiring process."
            />
            <ComplianceItem
              icon={<Search className="h-5 w-5" />}
              title="AI bias monitoring"
              body="All AI search sessions are logged and periodically audited for patterns that could indicate systemic bias in matching scores."
            />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-primary" />
              OnMatchIEHP
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
              <a href="mailto:support@onmatchhealth.ca" className="hover:text-foreground">
                support@onmatchhealth.ca
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} OnMatchIEHP. Designed for Ontario, Canada.
            OnMatchIEHP does not verify credentials or regulatory registration. All credential information
            is self-reported. Employers must confirm registration with the relevant Ontario regulatory college
            before making an offer.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      <span className="text-emerald-600">{icon}</span>
      {text}
    </div>
  );
}

function ComplianceItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
