import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { matchCandidates } from "@/lib/match.functions";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  MapPin,
  GraduationCap,
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [{ title: "Find Candidates — Ontario IEHP Workforce Integration Registry" }],
  }),
  component: SearchPage,
});

type Match = Awaited<ReturnType<typeof matchCandidates>>["matches"][number];

type RefProfession = { id: string; display_name: string };
type RefRegion = { id: string; display_name: string };

type VerificationStatus =
  | "loading"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "no_profile";

export default function SearchPage() {
  const run = useServerFn(matchCandidates);

  // Verification gate
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("loading");

  // Reference data for pre-filters
  const [professions, setProfessions] = useState<RefProfession[]>([]);
  const [regions, setRegions] = useState<RefRegion[]>([]);

  // Pre-filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterProfessionId, setFilterProfessionId] = useState<string>("");
  const [filterWorkAuthOnly, setFilterWorkAuthOnly] = useState(false);
  const [filterMinYears, setFilterMinYears] = useState<string>("");

  // Search state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check employer verification status
      const { data: emp } = await supabase
        .from("employer_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!emp) {
        setVerificationStatus("no_profile");
      } else {
        setVerificationStatus((emp.verification_status as VerificationStatus) ?? "pending");
      }

      // Load pre-filter reference data (graceful: empty arrays if table missing)
      const [profsRes, regionsRes] = await Promise.all([
        supabase.from("ref_professions").select("id, display_name").order("sort_order"),
        supabase.from("ref_ontario_regions").select("id, display_name").order("population_tier"),
      ]);
      setProfessions((profsRes.data as RefProfession[]) ?? []);
      setRegions((regionsRes.data as RefRegion[]) ?? []);

      // Load existing shortlists
      const { data: sl } = await supabase
        .from("shortlists")
        .select("professional_user_id")
        .eq("employer_user_id", user.id);
      setShortlisted(
        new Set((sl ?? []).map((s: { professional_user_id: string }) => s.professional_user_id)),
      );
    }
    load();
  }, []);

  async function go() {
    if (query.trim().length < 10) {
      toast.error("Describe the role in at least a sentence.");
      return;
    }
    setLoading(true);
    const res = await run({
      data: {
        query,
        profession_id: filterProfessionId || undefined,
        work_authorized_only: filterWorkAuthOnly || undefined,
        min_years_experience: filterMinYears ? parseInt(filterMinYears, 10) : undefined,
      },
    });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setMatches(res.matches);
    if (res.matches.length === 0)
      toast.info("No candidates matched yet — check back as more professionals join.");
  }

  async function toggleShortlist(professionalUserId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (shortlisted.has(professionalUserId)) {
      await supabase
        .from("shortlists")
        .delete()
        .eq("employer_user_id", user.id)
        .eq("professional_user_id", professionalUserId);
      setShortlisted((prev) => {
        const next = new Set(prev);
        next.delete(professionalUserId);
        return next;
      });
      toast.success("Removed from shortlist");
    } else {
      await supabase
        .from("shortlists")
        .insert({ employer_user_id: user.id, professional_user_id: professionalUserId });
      setShortlisted((prev) => new Set([...prev, professionalUserId]));
      toast.success("Saved to shortlist");
    }
  }

  // ── Verification gates ────────────────────────────────────────────────────

  if (verificationStatus === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
        </main>
      </div>
    );
  }

  if (verificationStatus === "no_profile" || verificationStatus === "pending") {
    return (
      <GateState
        icon={<Clock className="h-8 w-8 text-muted-foreground" />}
        title="Complete your organization profile"
        body="Fill in your organization details to submit your account for verification. Once verified, you'll have full access to candidate search."
        action={
          <Link to="/profile">
            <Button>Complete org profile</Button>
          </Link>
        }
      />
    );
  }

  if (verificationStatus === "under_review") {
    return (
      <GateState
        icon={<AlertCircle className="h-8 w-8 text-amber-500" />}
        title="Verification in progress"
        body="Your organization account is currently under review. We'll notify you by email once verified — typically within 1 business day."
      />
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <GateState
        icon={<XCircle className="h-8 w-8 text-destructive" />}
        title="Verification unsuccessful"
        body="We were unable to verify your organization. Please contact support@onmatchhealth.ca to resolve this."
      />
    );
  }

  // ── Verified employer: full search UI ────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h1 className="text-3xl font-bold">Find candidates</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Describe the role in plain English. Pre-filters narrow the pool before AI ranking.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Role description</CardTitle>
            <CardDescription>
              Example: "Full-time ICU nurse in Mississauga. Open to internationally educated
              candidates with NCLEX in progress. Punjabi or Tagalog a bonus."
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={5}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tell us about the role…"
            />

            {/* Pre-filter panel */}
            <div>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {filtersOpen ? "Hide filters" : "Add filters"}
                {(filterProfessionId || filterWorkAuthOnly || filterMinYears) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {
                      [filterProfessionId, filterWorkAuthOnly, filterMinYears].filter(Boolean)
                        .length
                    }
                  </Badge>
                )}
              </button>

              {filtersOpen && (
                <div className="mt-3 grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Profession</Label>
                    <Select value={filterProfessionId} onValueChange={setFilterProfessionId}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Any profession" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any profession</SelectItem>
                        {professions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Min. years experience</Label>
                    <Select value={filterMinYears} onValueChange={setFilterMinYears}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="1">1+ years</SelectItem>
                        <SelectItem value="3">3+ years</SelectItem>
                        <SelectItem value="5">5+ years</SelectItem>
                        <SelectItem value="10">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2 pb-1">
                    <Switch
                      id="work-auth"
                      checked={filterWorkAuthOnly}
                      onCheckedChange={setFilterWorkAuthOnly}
                    />
                    <Label htmlFor="work-auth" className="cursor-pointer text-xs leading-tight">
                      Work-authorized without
                      <br />
                      sponsorship only
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={go} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Matching…" : "Run AI match"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {matches.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Top matches</h2>
              <p className="text-sm text-muted-foreground">{matches.length} candidates ranked</p>
            </div>
            {matches.map((m, i) => (
              <MatchCard
                key={m.candidate.user_id}
                m={m}
                rank={i + 1}
                isShortlisted={shortlisted.has(m.candidate.user_id)}
                onToggleShortlist={() => toggleShortlist(m.candidate.user_id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Match result card ──────────────────────────────────────────────────────

function MatchCard({
  m,
  rank,
  isShortlisted,
  onToggleShortlist,
}: {
  m: Match;
  rank: number;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  const score = Math.round(m.score);
  const scoreColor =
    score >= 80
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : score >= 50
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-muted-foreground bg-muted border-border";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="text-muted-foreground">#{rank}</span>
              {m.candidate.profession}
              {m.candidate.specialty && (
                <span className="text-sm font-normal text-muted-foreground">
                  · {m.candidate.specialty}
                </span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                Trained in {m.candidate.country_of_training}
              </span>
              {m.candidate.current_city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {m.candidate.current_city}
                </span>
              )}
              <span>{m.candidate.years_experience} yrs experience</span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-sm font-semibold tabular-nums ${scoreColor}`}
            >
              {score}
            </span>
            <Button
              variant={isShortlisted ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={onToggleShortlist}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {isShortlisted ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          <span className="font-medium">Why this candidate: </span>
          {m.rationale}
        </p>
        {(m.strengths.length > 0 || m.gaps.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {m.strengths.length > 0 && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Strengths
                </p>
                <ul className="space-y-1">
                  {m.strengths.map((s, i) => (
                    <li key={i} className="flex gap-1.5 text-sm text-emerald-900">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {m.gaps.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Potential gaps
                </p>
                <ul className="space-y-1">
                  {m.gaps.map((g, i) => (
                    <li key={i} className="flex gap-1.5 text-sm text-amber-900">
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {m.criteria.length > 0 && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Score breakdown
            </p>
            <div className="space-y-2">
              {m.criteria.map((c, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(c.score)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${
                        c.score >= 80
                          ? "bg-emerald-500"
                          : c.score >= 50
                            ? "bg-amber-500"
                            : "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, c.score))}%` }}
                    />
                  </div>
                  {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {m.candidate.languages.map((l) => (
            <Badge key={l} variant="outline">
              {l}
            </Badge>
          ))}
          {m.candidate.credentials_status && (
            <Badge variant="outline">{m.candidate.credentials_status}</Badge>
          )}
          {m.candidate.license_exam_status && (
            <Badge variant="outline">{m.candidate.license_exam_status}</Badge>
          )}
          {/* Privacy-safe work auth label — never shows raw immigration status */}
          {m.candidate.work_authorized_without_sponsorship === true && (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
              Work-authorized
            </Badge>
          )}
          {m.candidate.work_authorized_without_sponsorship === false && (
            <Badge variant="outline" className="border-amber-200 text-amber-700">
              May require sponsorship
            </Badge>
          )}
        </div>
        {m.candidate.bio && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{m.candidate.bio}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Generic gate state ─────────────────────────────────────────────────────

function GateState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          {icon}
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="max-w-md text-muted-foreground">{body}</p>
          {action}
        </div>
      </main>
    </div>
  );
}
