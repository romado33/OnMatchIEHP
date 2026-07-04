import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope,
  Search,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Building2,
  GraduationCap,
  ArrowRight,
  EyeOff,
  Scale,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ontario IEHP Workforce Integration Registry — Ontario's match for internationally educated health professionals" },
      {
        name: "description",
        content:
          "Ontario IEHP Workforce Integration Registry connects internationally educated health professionals with verified Ontario healthcare employers using AI-powered matching.",
      },
      { property: "og:title", content: "Ontario IEHP Workforce Integration Registry" },
      {
        property: "og:description",
        content: "AI-powered matching for internationally educated health professionals and Ontario healthcare employers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeTab, setActiveTab] = useState<"professionals" | "employers">("professionals");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="hidden lg:inline">Ontario IEHP Workforce Integration Registry</span>
            <span className="lg:hidden">OIWIR</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Try a demo →
            </Link>
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
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-background">
        {/* Decorative soft-glow blobs */}
        <div className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute top-32 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <section className="relative mx-auto max-w-6xl px-6 pt-10 pb-20">
          <div>
            {/* Headline */}
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Internationally Educated Health Professionals,{" "}
              <span className="text-primary">matched with Ontario employers.</span>
            </h1>

            {/* Subtitle — tightened */}
            <p className="mt-6 text-lg text-muted-foreground">
              Turn your international training and credentials into AI-ranked matches with hospitals,
              clinics, and care organizations across Ontario — free for internationally educated
              health professionals and for employers.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2 shadow-md shadow-primary/20">
                  I'm a health professional <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2">
                  I'm hiring <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="ghost">
                  Try a demo account →
                </Button>
              </Link>
            </div>

            {/* Trust signals — distinct icons, positive wording */}
            <div className="mt-8 flex flex-wrap gap-4">
              <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />} text="Verified employers only" />
              <TrustPill icon={<EyeOff className="h-3.5 w-3.5" />} text="Your immigration status stays private" />
              <TrustPill icon={<Scale className="h-3.5 w-3.5" />} text="PIPEDA-compliant" />
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid gap-6 sm:grid-cols-3">
            <Feature
              image="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=240&fit=crop&crop=faces"
              imageAlt="Healthcare professional reviewing documents"
              title="Built for your journey"
              body="Capture your specialty, country of training, licensing pathway progress, and language strengths in one profile."
            />
            <Feature
              image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=240&fit=crop&crop=center"
              imageAlt="Man and woman in a professional greeting handshake"
              title="AI candidate matching"
              body="HR teams describe a role in plain English. We rank the most relevant candidates with transparent AI rationale."
            />
            <Feature
              image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=240&fit=crop"
              imageAlt="Medical professional in a secure setting"
              title="You control visibility"
              body="Toggle searchability anytime. Your profile is only shared with verified Ontario employers — never your immigration status."
            />
          </div>
        </section>
      </div>

      <Separator />

      {/* ── How it works (tabbed) ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          Ontario IEHP Workforce Integration Registry is built for both sides of the hiring relationship.
        </p>

        {/* Tab switcher */}
        <div className="mt-8 flex border-b border-border">
          <button
            onClick={() => setActiveTab("professionals")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "professionals"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            For health professionals
          </button>
          <button
            onClick={() => setActiveTab("employers")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "employers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" />
            For healthcare employers
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "professionals" ? (
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-10">Your path to Ontario healthcare</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <Step
                number="1"
                image="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=240&fit=crop&crop=top"
                imageAlt="Health professional reviewing patient information"
                title="Build your profile"
                body="Enter your profession, country of training, credential progress, languages, and location preferences. The more you add, the better your AI match score."
              />
              <Step
                number="2"
                image="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=240&fit=crop"
                imageAlt="Healthcare credentials and documents"
                title="Track your credentials"
                body="Use our guided credential tracker to record each step of your Ontario licensing journey — from initial assessment through to your Ontario college registration."
              />
              <Step
                number="3"
                image="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&h=240&fit=crop"
                imageAlt="Professional receiving a job match notification"
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
          </div>
        ) : (
          <div className="mt-12">
            <h3 className="text-2xl font-semibold mb-10">Find qualified candidates faster</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <Step
                number="1"
                image="https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=240&fit=crop"
                imageAlt="Healthcare team in a hospital setting"
                title="Verify your organization"
                body="Create an account, complete your organization profile, and submit for verification. Typically approved within 1 business day."
              />
              <Step
                number="2"
                image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=240&fit=crop"
                imageAlt="HR team searching and reviewing candidates"
                title="Post jobs or search directly"
                body="Post job listings visible to all professionals, or use AI candidate search — describe a role in plain English and get ranked matches instantly."
              />
              <Step
                number="3"
                image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=240&fit=crop"
                imageAlt="Healthcare team welcoming a new hire"
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
          </div>
        )}
      </section>

      <Separator />

      {/* ── Compliance & trust (trimmed to 3) ───────────────────────────── */}
      <section className="bg-gradient-to-br from-primary/[0.04] to-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold">Built with compliance in mind</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Healthcare hiring in Ontario involves real legal and ethical obligations. Ontario IEHP Workforce Integration Registry is
            designed around them.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
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
              icon={<Search className="h-5 w-5" />}
              title="AI bias monitoring"
              body="All AI search sessions are logged and periodically audited for patterns that could indicate systemic bias in matching scores."
            />
          </div>
          <div className="mt-8">
            <Link to="/privacy" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              See our full privacy and compliance approach <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Ontario IEHP Workforce Integration Registry</span>
              <span className="sm:hidden">OIWIR</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
              <a href="mailto:support@Ontario IEHP Workforce Integration Registry.ca" className="hover:text-foreground">
                support@Ontario IEHP Workforce Integration Registry.ca
              </a>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ontario IEHP Workforce Integration Registry. Designed for Ontario, Canada.
            Ontario IEHP Workforce Integration Registry does not verify credentials or regulatory registration. All credential information
            is self-reported. Employers must confirm registration with the relevant Ontario regulatory college
            before making an offer.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Feature({ image, imageAlt, title, body }: { image: string; imageAlt: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <img src={image} alt={imageAlt} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-1 border-t-2 border-t-primary/40">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Step({ number, image, imageAlt, title, body }: { number: string; image: string; imageAlt: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <img src={image} alt={imageAlt} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-1 border-t-2 border-t-primary/40">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {number}
        </div>
        <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      <span className="text-primary">{icon}</span>
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
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
