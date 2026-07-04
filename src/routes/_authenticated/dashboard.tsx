import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Circle,
  Star,
  Users,
  CalendarDays,
  Activity,
  MapPin,
  FileText,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ontario IEHP Workforce Integration Registry" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

// ── Types ─────────────────────────────────────────────────────────────────

type CredentialRow = {
  id: string;
  step_id: string | null;
  custom_step_name: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

type RefStep = {
  id: string;
  step_name: string;
  step_order: number;
  governing_body: string | null;
};

type ApplicationRow = {
  id: string;
  status: string;
  submitted_at: string;
  job_posting_id: string;
  jobTitle?: string;
  jobCity?: string;
};

type JobPosting = {
  id: string;
  title: string;
  specialty: string | null;
  city: string;
  employment_type: string;
  positions_available: number | null;
  appCount: number;
};

type SearchSession = {
  id: string;
  query_text: string;
  results_returned: number | null;
  candidate_pool_size: number | null;
  created_at: string;
};

type ShortlistEntry = {
  id: string;
  professional_user_id: string;
  list_name: string;
  notes: string | null;
  created_at: string;
  name?: string;
};

// ── Professional dashboard ─────────────────────────────────────────────────

type ProStats = {
  completeness_score: number;
  profile_view_count: number;
  is_searchable: boolean;
  views_this_week: number;
  credential_steps_done: number;
};

function ProDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<ProStats | null>(null);
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [refSteps, setRefSteps] = useState<Record<string, RefStep>>({});
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingSearch, setTogglingSearch] = useState(false);

  useEffect(() => {
    async function load() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [proRes, viewsRes, credRes, credListRes, refStepsRes, appRes] = await Promise.all([
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
        supabase
          .from("professional_credentials")
          .select("id, step_id, custom_step_name, status, started_at, completed_at, notes")
          .eq("user_id", userId),
        supabase
          .from("ref_credential_steps")
          .select("id, step_name, step_order, governing_body"),
        supabase
          .from("applications")
          .select("id, status, submitted_at, job_posting_id")
          .eq("applicant_user_id", userId)
          .order("submitted_at", { ascending: false }),
      ]);

      const stepMap: Record<string, RefStep> = {};
      (refStepsRes.data ?? []).forEach((s) => { stepMap[s.id] = s; });
      setRefSteps(stepMap);

      const credList = (credListRes.data ?? []) as CredentialRow[];
      // Sort by step_order if available
      credList.sort((a, b) => {
        const oa = a.step_id ? (stepMap[a.step_id]?.step_order ?? 99) : 99;
        const ob = b.step_id ? (stepMap[b.step_id]?.step_order ?? 99) : 99;
        return oa - ob;
      });
      setCredentials(credList);

      // Enrich applications with job titles
      const apps = (appRes.data ?? []) as ApplicationRow[];
      if (apps.length > 0) {
        const jobIds = apps.map((a) => a.job_posting_id);
        const { data: jobs } = await supabase
          .from("job_postings")
          .select("id, title, city")
          .in("id", jobIds);
        const jobMap: Record<string, { title: string; city: string }> = {};
        (jobs ?? []).forEach((j) => { jobMap[j.id] = { title: j.title, city: j.city }; });
        apps.forEach((a) => {
          a.jobTitle = jobMap[a.job_posting_id]?.title ?? "Unknown role";
          a.jobCity = jobMap[a.job_posting_id]?.city ?? "";
        });
      }
      setApplications(apps);

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
    if (error) { toast.error(error.message); return; }
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
    <div className="mt-6 space-y-8">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          label="Profile completeness"
          value={`${score}%`}
          sub={score < 40 ? "Below search threshold" : score >= 90 ? "Excellent" : "Good — keep going"}
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
          label="Credential steps done"
          value={`${stats?.credential_steps_done ?? 0} / ${credentials.length || "—"}`}
          sub="Completed or waived"
        />
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-5 w-5 text-primary" />
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

      {/* Profile completeness bar */}
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

      {/* Ontario RN Licensing Journey */}
      {credentials.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Your Ontario RN Licensing Journey
                </CardTitle>
                <CardDescription className="mt-1">
                  {stats?.credential_steps_done ?? 0} of {credentials.length} steps complete
                </CardDescription>
              </div>
              <Link to="/profile">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  Update <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {credentials.map((cred, i) => {
                const step = cred.step_id ? refSteps[cred.step_id] : null;
                const stepName = step?.step_name ?? cred.custom_step_name ?? "Custom step";
                const body = step?.governing_body;
                const isLast = i === credentials.length - 1;
                return (
                  <div key={cred.id} className="flex gap-3">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center">
                      <CredStatusIcon status={cred.status} />
                      {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[20px]" />}
                    </div>
                    {/* Content */}
                    <div className={`pb-5 flex-1 ${isLast ? "" : ""}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-medium ${cred.status === "completed" || cred.status === "waived" ? "text-muted-foreground line-through-none" : "text-foreground"}`}>
                          {stepName}
                        </span>
                        <CredStatusBadge status={cred.status} />
                        {body && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {body}
                          </span>
                        )}
                      </div>
                      {cred.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{cred.notes}</p>
                      )}
                      {(cred.started_at || cred.completed_at) && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {cred.completed_at
                            ? `Completed ${formatDate(cred.completed_at)}`
                            : cred.started_at
                            ? `Started ${formatDate(cred.started_at)}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              My Applications
            </CardTitle>
            <CardDescription>{applications.length} job application{applications.length !== 1 ? "s" : ""} submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {applications.map((app) => (
                <div key={app.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground leading-snug">{app.jobTitle}</p>
                    {app.jobCity && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {app.jobCity}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {formatDate(app.submitted_at)}
                    </p>
                  </div>
                  <AppStatusBadge status={app.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Action cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ActionCard
          icon={<UserCog className="h-5 w-5" />}
          title="My profile"
          body="Update credentials, languages, location preferences, and track your licensing progress."
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

// ── Employer dashboard ─────────────────────────────────────────────────────

type EmpStats = {
  verification_status: string;
  searches_today: number;
  daily_limit: number;
  shortlist_count: number;
  active_postings: number;
};

function EmployerDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<EmpStats | null>(null);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSession[]>([]);
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [empRes, searchesTodayRes, shortlistCountRes, postingsRes, recentSearchRes, shortlistRes] =
        await Promise.all([
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
            .select("id, title, specialty, city, employment_type, positions_available")
            .eq("employer_id", userId)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("ai_search_sessions")
            .select("id, query_text, results_returned, candidate_pool_size, created_at")
            .eq("employer_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("shortlists")
            .select("id, professional_user_id, list_name, notes, created_at")
            .eq("employer_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      // Enrich job postings with application counts
      const jobs = (postingsRes.data ?? []) as Omit<JobPosting, "appCount">[];
      const enrichedJobs: JobPosting[] = [];
      if (jobs.length > 0) {
        const jobIds = jobs.map((j) => j.id);
        const { data: apps } = await supabase
          .from("applications")
          .select("id, job_posting_id")
          .in("job_posting_id", jobIds);
        const countMap: Record<string, number> = {};
        (apps ?? []).forEach((a) => {
          countMap[a.job_posting_id] = (countMap[a.job_posting_id] ?? 0) + 1;
        });
        jobs.forEach((j) => enrichedJobs.push({ ...j, appCount: countMap[j.id] ?? 0 }));
      }
      setJobPostings(enrichedJobs);

      setRecentSearches((recentSearchRes.data ?? []) as SearchSession[]);

      // Enrich shortlist with candidate names
      const sl = (shortlistRes.data ?? []) as ShortlistEntry[];
      if (sl.length > 0) {
        const profIds = sl.map((s) => s.professional_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", profIds);
        const nameMap: Record<string, string> = {};
        (profiles ?? []).forEach((p) => { nameMap[p.id] = p.full_name; });
        sl.forEach((s) => { s.name = nameMap[s.professional_user_id] ?? "Unknown candidate"; });
      }
      setShortlist(sl);

      setStats({
        verification_status: empRes.data?.verification_status ?? "pending",
        searches_today: searchesTodayRes.count ?? 0,
        daily_limit: 20,
        shortlist_count: shortlistCountRes.count ?? 0,
        active_postings: postingsRes.data?.length ?? 0,
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
    <div className="mt-6 space-y-8">
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

      {/* Active Job Postings */}
      {jobPostings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Active Job Postings
                </CardTitle>
                <CardDescription>{jobPostings.length} active role{jobPostings.length !== 1 ? "s" : ""} visible to professionals</CardDescription>
              </div>
              <Link to="/jobs">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  Manage <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {jobPostings.map((job) => (
                <div key={job.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug truncate">{job.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{job.city}
                      </span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {job.employment_type.replace("_", " ")}
                      </Badge>
                      {job.specialty && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{job.specialty}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{job.appCount}</p>
                    <p className="text-xs text-muted-foreground">applicant{job.appCount !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">{job.positions_available} position{(job.positions_available ?? 0) !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shortlisted Candidates */}
      {shortlist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Shortlisted Candidates
                </CardTitle>
                <CardDescription>{shortlist.length} candidate{shortlist.length !== 1 ? "s" : ""} saved</CardDescription>
              </div>
              <Link to="/search">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {shortlist.map((entry) => (
                <div key={entry.id} className="py-3 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {(entry.name ?? "?")[0].replace("[", "").replace("D", "P")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.list_name} · Saved {formatDate(entry.created_at)}</p>
                    {entry.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground italic truncate">{entry.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent AI Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Recent Candidate Searches
                </CardTitle>
                <CardDescription>Your last {recentSearches.length} AI searches</CardDescription>
              </div>
              <Link to="/search">
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  New search <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentSearches.map((s) => (
                <div key={s.id} className="py-3">
                  <p className="text-sm text-foreground leading-snug">"{s.query_text}"</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {s.results_returned ?? 0} result{(s.results_returned ?? 0) !== 1 ? "s" : ""} from {s.candidate_pool_size ?? 0} candidates
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
          icon={<UserCog className="h-5 w-5" />}
          title="Organization profile"
          body="Keep your organization details up to date so candidates know who you are."
          to="/profile"
          cta="Edit org profile"
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
          <p>Contact support to resolve this.</p>
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
          <p className="text-muted-foreground">Fill in your organization details to submit for verification.</p>
        </div>
      </div>
      <Link to="/profile">
        <Button size="sm">Complete profile</Button>
      </Link>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, highlight,
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
  icon, title, body, to, cta, disabled, disabledReason,
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
          <Button disabled className="w-full sm:w-auto">{disabledReason ?? cta}</Button>
        ) : (
          <Link to={to}>
            <Button className="w-full sm:w-auto">{cta}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function CredStatusIcon({ status }: { status: string }) {
  if (status === "completed" || status === "waived")
    return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
  if (status === "in_progress" || status === "submitted")
    return <Clock className="h-5 w-5 text-primary shrink-0" />;
  if (status === "failed")
    return <XCircle className="h-5 w-5 text-destructive shrink-0" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />;
}

function CredStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    completed:   { label: "Done",        className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    waived:      { label: "Waived",      className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    in_progress: { label: "In progress", className: "bg-primary/10 text-primary border-primary/20" },
    submitted:   { label: "Submitted",   className: "bg-primary/10 text-primary border-primary/20" },
    failed:      { label: "Failed",      className: "bg-destructive/10 text-destructive border-destructive/20" },
    not_started: { label: "Pending",     className: "bg-muted text-muted-foreground border-border" },
    na:          { label: "N/A",         className: "bg-muted text-muted-foreground border-border" },
  };
  const cfg = map[status] ?? map.not_started;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    submitted:    { label: "Submitted",    className: "bg-muted text-muted-foreground border-border" },
    under_review: { label: "Under review", className: "bg-primary/10 text-primary border-primary/20" },
    shortlisted:  { label: "Shortlisted",  className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    interviewed:  { label: "Interview",    className: "bg-amber-100 text-amber-800 border-amber-200" },
    offered:      { label: "Offer!",       className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    rejected:     { label: "Not selected", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const cfg = map[status] ?? map.submitted;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
}
