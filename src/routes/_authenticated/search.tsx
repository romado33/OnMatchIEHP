import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { matchCandidates } from "@/lib/match.functions";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

type Match = Awaited<ReturnType<typeof matchCandidates>>["matches"][number];

function SearchPage() {
  const run = useServerFn(matchCandidates);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  async function go() {
    if (query.trim().length < 10) { toast.error("Describe the role in a sentence or two."); return; }
    setLoading(true);
    const res = await run({ data: { query } });
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    setMatches(res.matches);
    if (res.matches.length === 0) toast.info("No candidates matched yet — check back as more professionals join.");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Find candidates</h1>
        <p className="mt-2 text-muted-foreground">
          Describe the role in plain English — profession, location, must-haves, nice-to-haves. Our AI ranks the top matches with rationale.
        </p>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Role description</CardTitle>
            <CardDescription>
              Example: "Full-time ICU nurse in Mississauga, Ontario. Open to internationally trained candidates with NCLEX in progress. Punjabi or Tagalog a plus."
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tell us about the role…" />
            <Button onClick={go} disabled={loading}>
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Matching…" : "Run AI match"}
            </Button>
          </CardContent>
        </Card>

        {matches.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Top matches</h2>
            {matches.map((m, i) => (
              <Card key={m.candidate.user_id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{i + 1}</span>
                        {m.candidate.profession}
                        {m.candidate.specialty && <span className="text-muted-foreground">· {m.candidate.specialty}</span>}
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />Trained in {m.candidate.country_of_training}</span>
                        {m.candidate.current_city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.candidate.current_city}</span>}
                        <span>{m.candidate.years_experience} yrs experience</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Match {Math.round(m.score)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm"><span className="font-medium">Why this candidate:</span> {m.rationale}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.candidate.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
                    {m.candidate.credentials_status && <Badge variant="outline">{m.candidate.credentials_status}</Badge>}
                    {m.candidate.license_exam_status && <Badge variant="outline">{m.candidate.license_exam_status}</Badge>}
                    {m.candidate.work_authorization && <Badge variant="outline">{m.candidate.work_authorization}</Badge>}
                  </div>
                  {m.candidate.bio && <p className="text-sm text-muted-foreground">{m.candidate.bio}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}