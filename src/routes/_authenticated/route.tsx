import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Skip the consent check on the consent page itself to avoid an infinite redirect loop.
    if (!location.pathname.startsWith("/consent")) {
      const { data: consents, error: consentError } = await supabase
        .from("consent_records")
        .select("consent_type")
        .eq("user_id", data.user.id)
        .eq("consented", true)
        .in("consent_type", ["terms_of_service", "privacy_policy", "ai_processing"]);

      // If the consent_records table is not yet available (migration pending), allow through.
      if (!consentError) {
        const given = new Set(
          (consents ?? []).map((c: { consent_type: string }) => c.consent_type),
        );
        const hasAll =
          given.has("terms_of_service") &&
          given.has("privacy_policy") &&
          given.has("ai_processing");
        if (!hasAll) throw redirect({ to: "/consent" });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
