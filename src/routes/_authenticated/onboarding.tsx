import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [{ title: "Getting started — Ontario IEHP Workforce Integration Registry" }],
  }),
  component: Onboarding,
});

type Step = "pick_type" | "employer_details" | "employer_submitted";

// Employer org types used here before ref_org_types is loaded (fallback)
const ORG_TYPE_OPTIONS = [
  "Teaching Hospital",
  "Community Hospital",
  "Specialty Hospital",
  "Long-Term Care Facility",
  "Retirement Home",
  "Home Care Agency",
  "Primary Care Clinic / Family Health Team",
  "Specialist Clinic",
  "Mental Health Organization",
  "Community Health Centre (CHC)",
  "Rehabilitation Centre",
  "Diagnostic Imaging / Lab",
  "Pharmacy / Pharmacy Group",
  "Healthcare Staffing Agency",
  "Government / Ministry of Health",
  "Other",
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("pick_type");
  const [loading, setLoading] = useState<string | null>(null);
  const [employerForm, setEmployerForm] = useState({
    org_name: "",
    org_type: "",
    city: "",
    website: "",
    ontario_business_number: "",
  });

  async function pickProfessional() {
    setLoading("professional");
    // set_initial_user_role atomically inserts into user_roles AND updates
    // profiles.account_type in a single SECURITY DEFINER function.
    // Direct inserts to user_roles are no longer allowed from the client.
    const { error } = await supabase.rpc("set_initial_user_role", {
      _role: "professional",
    });
    setLoading(null);
    if (error && !error.message.includes("already assigned")) {
      toast.error(error.message || "Failed to save");
      return;
    }
    navigate({ to: "/profile" });
  }

  async function pickEmployer() {
    setLoading("employer");
    const { error } = await supabase.rpc("set_initial_user_role", {
      _role: "employer",
    });
    setLoading(null);
    if (error && !error.message.includes("already assigned")) {
      toast.error(error.message || "Failed to save");
      return;
    }
    // Move to employer detail step
    setStep("employer_details");
  }

  async function submitEmployerDetails() {
    if (!employerForm.org_name.trim()) {
      toast.error("Organization name is required.");
      return;
    }

    setLoading("submit");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(null);
      return;
    }

    const { error } = await supabase.from("employer_profiles").upsert(
      {
        user_id: user.id,
        org_name: employerForm.org_name,
        org_type: employerForm.org_type || null,
        city: employerForm.city || null,
        website: employerForm.website || null,
        ontario_business_number: employerForm.ontario_business_number || null,
        verification_status: "under_review",
      },
      { onConflict: "user_id" },
    );

    setLoading(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setStep("employer_submitted");
  }

  // ── Step 1: pick account type ──────────────────────────────────────────

  if (step === "pick_type") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-3xl">
          <h1 className="mb-2 text-center text-3xl font-bold">Which best describes you?</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Choose your account type. You can only choose one.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className="cursor-pointer transition hover:border-primary"
              onClick={pickProfessional}
            >
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <CardTitle className="mt-3">Health professional</CardTitle>
                <CardDescription>
                  I'm internationally educated and looking for opportunities in Ontario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled={loading === "professional"} className="w-full">
                  {loading === "professional" ? "Saving…" : "Continue as professional"}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition hover:border-primary" onClick={pickEmployer}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="mt-3">Healthcare employer</CardTitle>
                <CardDescription>
                  I'm hiring for a hospital, clinic, or care organization in Ontario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled={loading === "employer"} className="w-full" variant="outline">
                  {loading === "employer" ? "Saving…" : "Continue as employer"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: employer basic details ────────────────────────────────────

  if (step === "employer_details") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-lg">
          <h1 className="mb-2 text-center text-3xl font-bold">Tell us about your organization</h1>
          <p className="mb-8 text-center text-muted-foreground">
            We'll use this to verify your organization. Candidate search unlocks once verified.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Organization details</CardTitle>
              <CardDescription>
                Fields marked * are required. Verification typically takes 1 business day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Organization name *</Label>
                <Input
                  value={employerForm.org_name}
                  onChange={(e) => setEmployerForm((s) => ({ ...s, org_name: e.target.value }))}
                  placeholder="e.g. Sunnybrook Health Sciences Centre"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Organization type</Label>
                <Select
                  value={employerForm.org_type}
                  onValueChange={(v) => setEmployerForm((s) => ({ ...s, org_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={employerForm.city}
                  onChange={(e) => setEmployerForm((s) => ({ ...s, city: e.target.value }))}
                  placeholder="e.g. Toronto"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={employerForm.website}
                  onChange={(e) => setEmployerForm((s) => ({ ...s, website: e.target.value }))}
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ontario Business Registration Number (optional)</Label>
                <Input
                  value={employerForm.ontario_business_number}
                  onChange={(e) =>
                    setEmployerForm((s) => ({ ...s, ontario_business_number: e.target.value }))
                  }
                  placeholder="Helps speed up verification"
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                By submitting, you confirm your organization is a legitimate Ontario healthcare
                employer and agree to use the platform in compliance with the{" "}
                <em>Ontario Human Rights Code</em> and applicable employment law.
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={submitEmployerDetails}
                  disabled={loading === "submit"}
                  className="flex-1"
                >
                  {loading === "submit" ? "Submitting…" : "Submit for verification"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 3: employer submission confirmation ───────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Verification submitted</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you — your organization has been submitted for verification. We'll notify you by
          email once approved, typically within 1 business day.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          In the meantime, you can post job listings and complete your organization profile.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate({ to: "/jobs" })}>Post a job listing</Button>
          <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
