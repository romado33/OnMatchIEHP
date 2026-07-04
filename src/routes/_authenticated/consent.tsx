import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/consent")({
  head: () => ({
    meta: [{ title: "Privacy & Terms — Ontario IEHP Workforce Integration Registry" }],
  }),
  component: ConsentPage,
});

const CONSENT_VERSION = "2026-06-24";

function ConsentPage() {
  const navigate = useNavigate();
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  const allChecked = tos && privacy && aiProcessing;

  async function handleSubmit() {
    if (!allChecked) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const records = [
      { user_id: user.id, consent_type: "terms_of_service", version: CONSENT_VERSION, consented: true },
      { user_id: user.id, consent_type: "privacy_policy", version: CONSENT_VERSION, consented: true },
      { user_id: user.id, consent_type: "ai_processing", version: CONSENT_VERSION, consented: true },
    ];

    const { error } = await supabase.from("consent_records").insert(records);
    setLoading(false);

    if (error) {
      toast.error("Failed to save your consent. Please try again.");
      return;
    }

    // Direct to onboarding if no account type yet, otherwise dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();

    navigate({ to: profile?.account_type ? "/dashboard" : "/onboarding" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2 font-semibold text-foreground">
          <Stethoscope className="h-5 w-5 text-primary" />
          Ontario IEHP Workforce Integration Registry
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Before you continue</CardTitle>
            </div>
            <CardDescription>
              Please review and agree to the following. You can withdraw consent at any time from your account
              settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ConsentItem
              id="tos"
              checked={tos}
              onCheckedChange={setTos}
              label={
                <>
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary underline underline-offset-2" target="_blank">
                    Terms of Service
                  </Link>
                </>
              }
              description="Governs your use of Ontario IEHP Workforce Integration Registry, including account responsibilities and acceptable conduct on the platform."
            />

            <ConsentItem
              id="privacy"
              checked={privacy}
              onCheckedChange={setPrivacy}
              label={
                <>
                  I agree to the{" "}
                  <Link to="/privacy" className="text-primary underline underline-offset-2" target="_blank">
                    Privacy Policy
                  </Link>
                </>
              }
              description="Explains what personal information we collect, how we use it, and your rights under PIPEDA and Ontario privacy law. We never share your immigration status with employers without your explicit consent."
            />

            <ConsentItem
              id="ai"
              checked={aiProcessing}
              onCheckedChange={setAiProcessing}
              label="I consent to AI-powered matching using my profile data"
              description="Your profile information may be processed by our AI matching system to connect you with relevant opportunities or candidates. Sensitive fields such as work authorization status are never shared with employers in identifiable form."
            />

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Ontario IEHP Workforce Integration Registry is designed for use by healthcare professionals and employers in Ontario, Canada. By
              continuing, you confirm that your use of this platform complies with applicable employment and
              privacy laws.
            </div>

            <Button onClick={handleSubmit} disabled={!allChecked || loading} className="w-full">
              {loading ? "Saving…" : "Continue to Ontario IEHP Workforce Integration Registry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConsentItem({
  id,
  checked,
  onCheckedChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: React.ReactNode;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        className="mt-0.5 shrink-0"
      />
      <div className="space-y-1">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium leading-none">
          {label}
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
