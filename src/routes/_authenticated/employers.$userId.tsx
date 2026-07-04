import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getEmployerProfile, type EmployerProfileResult } from "@/lib/candidate.functions";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  Building2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/employers/$userId")({
  head: () => ({
    meta: [{ title: "Employer Profile — Ontario IEHP Workforce Integration Registry" }],
  }),
  component: EmployerProfilePage,
});

type Job = EmployerProfileResult["jobs"][number];

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EmployerProfilePage() {
  const { userId } = Route.useParams();
  const load = useServerFn(getEmployerProfile);

  const [data, setData] = useState<EmployerProfileResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load({ data: { userId } }).then((d) => {
      setData(d);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <>
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <div className="text-muted-foreground text-sm">Loading employer profile…</div>
        </main>
      </>
    );
  }

  if (!data?.empProfile) {
    return (
      <>
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-muted-foreground">Employer profile not found.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
            </Button>
          </Link>
        </main>
      </>
    );
  }

  const { empProfile: ep, jobs } = data;

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
                {ep.org_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold">{ep.org_name}</h1>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified Employer
                  </Badge>
                </div>
                {ep.org_type && (
                  <p className="text-sm text-muted-foreground mt-0.5">{ep.org_type}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {ep.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {ep.city}
                    </span>
                  )}
                  {ep.website && (
                    <a
                      href={ep.website.startsWith("http") ? ep.website : `https://${ep.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" /> {ep.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {ep.about && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{ep.about}</p>
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        {ep.contact_name && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> HR Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{ep.contact_name}</p>
              {ep.contact_phone && <p>{ep.contact_phone}</p>}
            </CardContent>
          </Card>
        )}

        {/* Active job postings */}
        {jobs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Active Job Postings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{job.title}</p>
                      {job.employment_type && (
                        <Badge variant="secondary" className="text-xs capitalize shrink-0">
                          {job.employment_type.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    {job.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {job.city}
                      </p>
                    )}
                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {job.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Posted {formatDate(job.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground text-center pb-4">
          This employer is verified by Ontario IEHP Workforce Integration Registry.
        </p>
      </main>
    </>
  );
}
