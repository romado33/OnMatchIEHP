import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCandidateProfile } from "@/lib/candidate.functions";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Star,
  Languages,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidates/$userId")({
  head: () => ({ meta: [{ title: "Candidate Profile — Ontario IEHP Workforce Integration Registry" }] }),
  component: CandidateProfilePage,
});

type ProfileData = Awaited<ReturnType<ReturnType<typeof getCandidateProfile>>>;
type Cred = ProfileData["credentials"][number];

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function CredStatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
  if (status === "in_progress" || status === "submitted") return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function CredStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    in_progress: "bg-amber-100 text-amber-800 border-amber-200",
    submitted: "bg-blue-100 text-blue-800 border-blue-200",
    not_started: "bg-muted text-muted-foreground",
    waived: "bg-purple-100 text-purple-800 border-purple-200",
  };
  const label: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    submitted: "Submitted",
    not_started: "Not Started",
    waived: "Waived",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </Badge>
  );
}

export default function CandidateProfilePage() {
  const { userId } = Route.useParams();
  const load = useServerFn(getCandidateProfile);

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load({ data: { userId } }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <>
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-muted-foreground text-sm">Loading candidate profile…</div>
        </main>
      </>
    );
  }

  if (!data?.proProfile) {
    return (
      <>
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-muted-foreground">Candidate profile not found or not yet visible.</p>
          <Link to="/dashboard"><Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard</Button></Link>
        </main>
      </>
    );
  }

  const { profile, proProfile: pp, credentials, languages } = data;
  const name = profile?.full_name ?? "Candidate";
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const completedSteps = credentials.filter((c: Cred) => c.status === "completed" || c.status === "waived").length;
  const totalSteps = credentials.length;

  return (
    <>
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
          </Button>
        </Link>

        {/* Hero card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold">{name}</h1>
                  {pp.is_searchable && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Open to opportunities
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pp.profession}{pp.specialty ? ` · ${pp.specialty}` : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {pp.current_city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {pp.current_city}
                      {pp.willing_to_relocate && ", willing to relocate"}
                    </span>
                  )}
                  {pp.country_of_training && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> Educated in {pp.country_of_training}
                    </span>
                  )}
                  {pp.years_experience != null && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {pp.years_experience} years experience
                    </span>
                  )}
                </div>

                {pp.available_from && (
                  <p className="mt-2 text-sm flex items-center gap-1 text-emerald-700">
                    <Calendar className="h-3.5 w-3.5" />
                    Available from {formatDate(pp.available_from)}
                  </p>
                )}
              </div>

              {/* Score badge */}
              <div className="text-center shrink-0">
                <div className="text-2xl font-bold text-primary">{pp.completeness_score ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Profile complete</div>
              </div>
            </div>

            {/* Tags */}
            {(pp.desired_employment_types?.length || pp.desired_role_types?.length) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(pp.desired_employment_types ?? []).map((t: string) => (
                  <Badge key={t} variant="secondary" className="text-xs capitalize">{t.replace("_", " ")}</Badge>
                ))}
                {(pp.desired_role_types ?? []).map((t: string) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio */}
        {pp.bio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> About this candidate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{pp.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Credentials + licensing journey */}
        {credentials.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" /> Ontario Licensing Journey
                </CardTitle>
                <span className="text-xs text-muted-foreground">{completedSteps} / {totalSteps} steps done</span>
              </div>
              {pp.license_exam_status && (
                <p className="text-xs text-muted-foreground mt-1">{pp.license_exam_status}</p>
              )}
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {credentials.map((cred: Cred, i: number) => {
                  const step = (cred as any).ref_credential_steps as {
                    step_number: number; title: string; description: string;
                    governing_body: string; typical_duration_weeks: number; is_required: boolean;
                  } | null;
                  return (
                    <li key={cred.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <CredStatusIcon status={cred.status} />
                        {i < credentials.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {step?.step_number}. {step?.title ?? cred.step_id}
                          </span>
                          <CredStatusBadge status={cred.status} />
                          {step?.is_required === false && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Optional</Badge>
                          )}
                        </div>
                        {step?.governing_body && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.governing_body}</p>
                        )}
                        {cred.notes && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{cred.notes}</p>
                        )}
                        {(cred.started_at || cred.completed_at) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cred.completed_at ? `Completed ${formatDate(cred.completed_at)}` : cred.started_at ? `Started ${formatDate(cred.started_at)}` : ""}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Languages className="h-4 w-4 text-primary" /> Language Proficiencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {languages.map((lang: any) => (
                  <div key={lang.language_code} className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{lang.language_code.toUpperCase()}</span>
                    <div className="flex items-center gap-2">
                      {lang.test_id && lang.test_score && (
                        <span className="text-xs text-muted-foreground">{lang.test_id}: {lang.test_score}</span>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">{lang.proficiency_level}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credentials status summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Work Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {pp.currently_in_canada
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />}
                Currently in Canada
              </div>
              <div className="flex items-center gap-2">
                {pp.work_authorized_without_sponsorship
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />}
                Work authorized without sponsorship
              </div>
              {pp.credentials_status && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <span className="font-medium">Credential status: </span>{pp.credentials_status}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground text-center pb-4">
          This profile is shared in confidence. Contact the candidate through verified channels only.
        </p>
      </main>
    </>
  );
}
