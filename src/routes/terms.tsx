import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Ontario IEHP Workforce Integration Registry" },
      {
        name: "description",
        content: "Ontario IEHP Workforce Integration Registry Terms of Service.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <Stethoscope className="h-5 w-5 text-primary" />
            Ontario IEHP Workforce Integration Registry
          </Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-2 text-sm text-muted-foreground">Last updated: June 24, 2026</div>
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">
          These Terms of Service ("Terms") govern your access to and use of the Ontario IEHP
          Workforce Integration Registry platform ("Platform"), operated by Ontario IEHP Workforce
          Integration Registry ("we", "us"). By creating an account, you agree to these Terms. If
          you do not agree, do not use the Platform.
        </p>

        <PolicySection title="1. Eligibility">
          <p>
            You must be at least 18 years old to use the Platform. The Platform is intended for use
            in connection with healthcare employment in Ontario, Canada. You represent that the
            information you provide is accurate and complete.
          </p>
        </PolicySection>

        <PolicySection title="2. Account responsibilities">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. You agree to notify us immediately of
            any unauthorized use.
          </p>
          <p>
            You may not create more than one account per account type (professional or employer).
            Account type changes require contacting support.
          </p>
        </PolicySection>

        <PolicySection title="3. Professional accounts">
          <p>As a health professional, you agree to:</p>
          <ul>
            <li>
              Provide accurate and truthful information about your qualifications, credentials, and
              work history
            </li>
            <li>Not claim credentials, licenses, or registrations that you do not hold</li>
            <li>Keep your credential progress and availability status current</li>
            <li>Not misrepresent your work authorization status</li>
          </ul>
          <p>
            <strong>Credential disclaimer:</strong> Ontario IEHP Workforce Integration Registry does
            not verify credentials, licensing status, or regulatory registration. Commencement of
            clinical practice in Ontario requires valid registration with the applicable regulatory
            college. The Platform is for employment connection purposes only.
          </p>
        </PolicySection>

        <PolicySection title="4. Employer accounts">
          <p>As a healthcare employer, you agree to:</p>
          <ul>
            <li>
              Provide accurate information about your organization and verify your organization's
              identity during the verification process
            </li>
            <li>Use candidate information only for lawful employment purposes</li>
            <li>
              Comply with the <em>Ontario Human Rights Code</em> and the{" "}
              <em>Canadian Human Rights Act</em> in all hiring decisions. You may not discriminate
              on the basis of citizenship, place of origin, ethnicity, or immigration status.
            </li>
            <li>
              Not use the Platform to access candidate information for any purpose other than
              evaluating candidates for genuine employment opportunities
            </li>
            <li>Not share candidate profile data with third parties outside your hiring team</li>
            <li>
              Confirm the regulatory registration of any candidate before offering employment in a
              regulated health profession
            </li>
          </ul>
          <p>
            <strong>Verification requirement:</strong> Employer accounts must be verified before
            accessing candidate search. We reserve the right to revoke verification if we determine
            an account is being used in violation of these Terms.
          </p>
        </PolicySection>

        <PolicySection title="5. Prohibited conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Post false, misleading, or discriminatory job listings</li>
            <li>
              Attempt to identify or contact professionals using information outside of the
              Platform's messaging system without their consent
            </li>
            <li>Scrape, harvest, or systematically extract data from the Platform</li>
            <li>Circumvent security or access controls</li>
            <li>Use AI search results to discriminate against candidates on protected grounds</li>
            <li>Harass, threaten, or intimidate other users</li>
          </ul>
        </PolicySection>

        <PolicySection title="6. AI-powered matching">
          <p>
            The Platform uses AI to match candidates with employer searches. You acknowledge that:
          </p>
          <ul>
            <li>
              AI-generated match scores and rationale are suggestions, not guarantees of suitability
            </li>
            <li>
              AI matching may not capture all relevant factors and should be used as one input among
              many in hiring decisions
            </li>
            <li>
              Employers are solely responsible for their hiring decisions and compliance with
              applicable employment law
            </li>
            <li>
              We monitor AI outputs for potential bias and may modify the system at any time to
              address identified issues
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="7. Intellectual property">
          <p>
            The Platform, including its design, features, and content created by Ontario IEHP
            Workforce Integration Registry, is our intellectual property. You retain ownership of
            content you submit (your profile information). By submitting content, you grant us a
            license to use it to operate and improve the Platform.
          </p>
        </PolicySection>

        <PolicySection title="8. Disclaimers and limitation of liability">
          <p>
            The Platform is provided "as is" without warranties of any kind. We do not guarantee:
            employment outcomes, accuracy of AI matching, availability of the Platform, or that all
            employers or professionals are who they claim to be.
          </p>
          <p>
            To the maximum extent permitted by law, Ontario IEHP Workforce Integration Registry's
            liability to you for any claim arising from use of the Platform is limited to the amount
            you paid us in the 12 months preceding the claim (or $100 CAD if no payment was made).
          </p>
        </PolicySection>

        <PolicySection title="9. Termination">
          <p>
            We may suspend or terminate your account if we believe you have violated these Terms,
            with or without notice. You may close your account at any time via account settings.
            Upon termination, your profile will be removed from search results and your data handled
            per our Privacy Policy.
          </p>
        </PolicySection>

        <PolicySection title="10. Governing law">
          <p>
            These Terms are governed by the laws of the Province of Ontario and the federal laws of
            Canada applicable therein. Any disputes shall be resolved in the courts of Ontario.
          </p>
        </PolicySection>

        <PolicySection title="11. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will notify you by email and require
            re-acceptance for material changes. Continued use of the Platform after the effective
            date constitutes acceptance of the updated Terms.
          </p>
        </PolicySection>

        <PolicySection title="12. Contact">
          <p>
            Questions about these Terms:
            <br />
            <strong>Email:</strong>{" "}
            <a href="mailto:legal@onmatchhealth.ca" className="text-primary underline">
              legal@onmatchhealth.ca
            </a>
          </p>
        </PolicySection>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
          <p className="mt-2">
            © {new Date().getFullYear()} Ontario IEHP Workforce Integration Registry
          </p>
        </div>
      </footer>
    </div>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
