import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  UserCog,
  Briefcase,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bookmark,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OnMatchIEHP" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("account_type, full_name")
        .eq("id", user.id)
        .maybeSingle();
      setAccountType(data?.account_type ?? null);
      setName(data?.full_name ?? user.email ?? "");

      if (!data?.account_type) navigate({ to: "/onboarding" });
    })();
  }, [navigate]);

  if (accountType === undefined) return null;

  const firstName = name.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          Welcome{firstName ? `, ${firstName}` : ""}.
        </h1>

        {accountType === "professional" ? (
          <ProDashboard userId={userId} />
        ) : (
          <EmployerDashboard userId={userId} />
        )}
      </main>
    </div>
  );
}

// ── Professional dashboard ────────────────────────────────────────────────

type ProStats = {
  completeness_score: number;
  profile_view_count: number;
  is_searchable: boolean;
  views_this_week: number;
  credential_steps_done: number;
};

function ProDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<ProStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingSearch, setTogglingSearch] = useState(false);

  useEffect(() => {
    async function load() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [proRes, viewsRes, credRes] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("completeness_score, profile_view_count, is_searchable")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profile_view_events")
          .select("id", { count: "exact" })
          .eq("professional_user_id", userId)
          .gte("viewed_at", weekAgo),
        supabase
          .from("professional_credentials")
          .select("status", { count: "exact" })
          .eq("user_id", userId)
          .in("status", ["completed", "waived"]),
      ]);

      setStats({
        completeness_score: proRes.data?.completeness_score ?? 0,
        profile_view_count: proRes.data?.profile_view_count ?? 0,
        is_searchable: proRes.data?.is_searchable ?? false,
        views_this_week: viewsRes.count ?? 0,
        credential_steps_done: credRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, [userId]);

  async function toggleSearchable() {
    if (!stats) return;
    setTogglingSearch(true);
    const newVal = !stats.is_searchable;
    const { error } = await supabase
      .from("professional_profiles")
      .update({ is_searchable: newVal })
      .eq("user_id", userId);
    setTogglingSearch(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStats((s) => s && { ...s, is_searchable: newVal });
    toast.success(newVal ? "Profile is now visible to employers" : "Profile is now hidden");
  }

  if (loading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const score = stats?.completeness_score ?? 0;
  const nextStep =
    score < 40 ? "Complete your profile to appear in searches"
    : score < 70 ? "Add your credential progress to improve matches"
    : score < 90 ? "Add a bio and availability date to finish your profile"
    : null;

  return (
    <div className="mt-6 space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Profile completeness"
          value={`${score}%`}
          sub={score < 40 ? "Below search threshold" : score >= 90 ? "Excellent" : "Good"}
          highlight={score < 40 ? "destructive" : score >= 70 ? "success" : "warn"}
        />
        <StatCard
          icon={<Eye className="h-5 w-5 text-primary" />}
          label="Profile views this week"
          value={String(stats?.views_this_week ?? 0)}
          sub={`${stats?.profile_view_count ?? 0} all time`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          label="Credential steps complete"
          value={String(stats?.credential_steps_done ?? 0)}
          sub="Track progress in your profile"
        />
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Searchable by employers
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor="searchable-toggle">
              {stats?.is_searchable ? "Your profile is visible" : "Your profile is hidden"}
            </Label>
            <Switch
              id="searchable-toggle"
              checked={stats?.is_searchable ?? false}
              onCheckedChange={toggleSearchable}
              disabled={togglingSearch}
            />
          </div>
        </div>
      </div>

      {/* Completeness progress */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Profile completeness</span>
            <span className="font-semibold text-muted-foreground">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
          {nextStep && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">{nextStep}</p>
              <Link to="/profile">
                <Button variant="link" size="sm" className="h-auto py-0 text-xs">
                  Edit profile <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Action cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ActionCard
          icon={<UserCog className="h-5 w-5" />}
          title="My profile"
          body="Add credentials, languages, location preferences, and track your licensing progress."
          to="/profile"
          cta="Edit profile"
        />
        <ActionCard
          icon={<Briefcase className="h-5 w-5" />}
          title="Browse job postings"
          body="See active roles posted by verified Ontario healthcare employers."
          to="/jobs"
          cta="Browse jobs"
        />
      </div>
    </div>
  );
}

// ── Employer dashboard ────────────────────────────────────────────────────

type EmpStats = {
  verification_status: string;
  searches_today: number;
  daily_limit: number;
  shortlist_count: number;
  active_postings: number;
};

function EmployerDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<EmpStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [empRes, searchesRes, shortlistRes, postingsRes] = await Promise.all([
        supabase
          .from("employer_profiles")
          .select("verification_status")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("ai_search_sessions")
          .select("id", { count: "exact" })
          .eq("employer_user_id", userId)
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("shortlists")
          .select("id", { count: "exact" })
          .eq("employer_user_id", userId),
        supabase
          .from("job_postings")
          .select("id", { count: "exact" })
          .eq("employer_id", userId)
          .eq("is_active", true),
      ]);

      setStats({
        verification_status: empRes.data?.verification_status ?? "pending",
        searches_today: searchesRes.count ?? 0,
        daily_limit: 20,
        shortlist_count: shortlistRes.count ?? 0,
        active_postings: postingsRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const verStatus = stats?.verification_status ?? "pending";

  return (
    <div className="mt-6 space-y-6">
      {/* Verification banner */}
      <VerificationBanner status={verStatus} />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Search className="h-5 w-5 text-primary" />}
          label="AI searches today"
          value={`${stats?.searches_today ?? 0} / ${stats?.daily_limit ?? 20}`}
          sub="Resets at midnight"
        />
        <StatCard
          icon={<Bookmark className="h-5 w-5 text-primary" />}
          label="Saved candidates"
          value={String(stats?.shortlist_count ?? 0)}
          sub="In your shortlist"
        />
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          label="Active job postings"
          value={String(stats?.active_postings ?? 0)}
          sub={stats?.active_postings === 0 ? "No active postings" : "Visible to professionals"}
          highlight={stats?.active_postings === 0 ? "warn" : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          label="Account status"
          value={
            verStatus === "verified" ? "Verified"
            : verStatus === "under_review" ? "Under review"
            : verStatus === "rejected" ? "Rejected"
            : "Pending"
          }
          highlight={
            verStatus === "verified" ? "success"
            : verStatus === "rejected" ? "destructive"
            : "warn"
          }
          sub=""
        />
      </div>

      <Separator />

      {/* Action cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ActionCard
          icon={<Search className="h-5 w-5" />}
          title="Find candidates"
          body="Describe a role and let AI rank the best-matching internationally educated professionals."
          to="/search"
          cta="Start a search"
          disabled={verStatus !== "verified"}
          disabledReason="Available after verification"
        />
        <ActionCard
          icon={<Briefcase className="h-5 w-5" />}
          title="Job postings"
          body="Create and manage active job listings visible to professionals on the platform."
          to="/jobs"
          cta="Manage postings"
        />
        <ActionCard
          icon={<UserCog className="h-5 w-5" />}
          title="Organization profile"
          body="Keep your organization details up to date so candidates know who you are."
          to="/profile"
          cta="Edit org profile"
        />
        <ActionCard
          icon={<Bookmark className="h-5 w-5" />}
          title="Saved candidates"
          body={`You have ${stats?.shortlist_count ?? 0} candidate${stats?.shortlist_count === 1 ? "" : "s"} saved. Review and manage your shortlist.`}
          to="/search"
          cta="View shortlist"
        />
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────

function VerificationBanner({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          Your organization is verified. You have full access to candidate search.
        </p>
      </div>
    );
  }
  if (status === "under_review") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Clock className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Verification in progress</p>
          <p>Your account is under review. Candidate search will unlock once verified — typically within 1 business day.</p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
        <div className="text-sm text-destructive">
          <p className="font-medium">Verification unsuccessful</p>
          <p>Contact support@onmatchhealth.ca to resolve this.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">Complete your org profile to unlock search</p>
          <p className="text-muted-foreground">Fill in your organization details to submit your account for verification.</p>
        </div>
      </div>
      <Link to="/profile">
        <Button size="sm">Complete profile</Button>
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: "success" | "warn" | "destructive";
}) {
  const valueColor =
    highlight === "success" ? "text-emerald-600"
    : highlight === "warn" ? "text-amber-600"
    : highlight === "destructive" ? "text-destructive"
    : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  body,
  to,
  cta,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  to: string;
  cta: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="mt-3 text-base">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <Button disabled className="w-full sm:w-auto">
            {disabledReason ?? cta}
          </Button>
        ) : (
          <Link to={to}>
            <Button className="w-full sm:w-auto">{cta}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
