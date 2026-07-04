import { createFileRoute, Link } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Ontario IEHP Workforce Integration Registry" },
      {
        name: "description",
        content:
          "Ontario IEHP Workforce Integration Registry Privacy Policy — how we collect, use, and protect your personal information under PIPEDA and Ontario privacy law.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">
          Ontario IEHP Workforce Integration Registry ("we", "us", "our") operates the Ontario IEHP
          Workforce Integration Registry platform, which connects internationally educated health
          professionals with Ontario healthcare employers. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your personal information in compliance with the{" "}
          <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and
          applicable Ontario privacy law.
        </p>

        <PolicySection title="1. What information we collect">
          <p>
            We collect personal information that you provide directly when creating an account or
            completing your profile:
          </p>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address, password (hashed)
            </li>
            <li>
              <strong>Professional profile:</strong> profession, specialty, country of training,
              years of experience, languages, clinical credentials and licensing progress, work
              availability, career preferences, bio
            </li>
            <li>
              <strong>Location information:</strong> current city, preferred Ontario regions,
              whether you are currently in Canada
            </li>
            <li>
              <strong>Work authorization status:</strong> your self-reported
              immigration/work-authorization category. This is used only to calculate a privacy-safe
              "work-authorized without sponsorship" indicator — the raw category is never disclosed
              to employers unless you explicitly consent.
            </li>
            <li>
              <strong>Employer organization information:</strong> organization name, type, city,
              contact details, Ontario Business Number (optional)
            </li>
            <li>
              <strong>Documents:</strong> if you upload credential documents, file metadata (name,
              type, size) is stored. File contents are stored in encrypted storage accessible only
              to you.
            </li>
            <li>
              <strong>Usage data:</strong> pages visited, search queries run (for employers), AI
              matching results, notification interactions
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="2. How we use your information">
          <p>We use your personal information to:</p>
          <ul>
            <li>Operate and improve the Ontario IEHP Workforce Integration Registry platform</li>
            <li>
              Match professional profiles with relevant employer searches using AI (with your
              consent)
            </li>
            <li>
              Send transactional emails (account confirmation, notifications, verification updates)
            </li>
            <li>Monitor for bias in AI matching outcomes to ensure fair treatment</li>
            <li>Comply with legal obligations</li>
            <li>Respond to your requests or complaints</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information. We do not use your data for
            advertising.
          </p>
        </PolicySection>

        <PolicySection title="3. Who we share your information with">
          <p>
            <strong>Verified Ontario employers</strong> — when your profile is set to searchable,
            verified employer accounts can view your professional profile. They see: profession,
            specialty, country of training, years of experience, languages, credential progress,
            availability, and bio.
          </p>
          <p>
            <strong>What employers do NOT see:</strong> your specific work-authorization or
            immigration status (unless you explicitly consent to share it), your full name before
            you choose to share it, your uploaded documents.
          </p>
          <p>
            <strong>AI service providers</strong> — your profile data may be sent to third-party AI
            services (currently Google Gemini via the Lovable AI Gateway) for candidate matching. We
            do not send your work-authorization status, name, or uploaded documents to AI services.
            You consent to this use when you accept our AI processing consent.
          </p>
          <p>
            <strong>Infrastructure providers</strong> — Supabase (database and authentication,
            hosted on AWS in Canada/US), Lovable.dev (hosting platform). Both are bound by data
            processing agreements.
          </p>
          <p>
            <strong>Legal requirements</strong> — we may disclose information if required by law,
            court order, or to protect the rights and safety of platform users.
          </p>
        </PolicySection>

        <PolicySection title="4. Your rights under PIPEDA">
          <p>You have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> — request a copy of the personal information we hold about you
            </li>
            <li>
              <strong>Correction</strong> — update or correct inaccurate information via your
              profile page
            </li>
            <li>
              <strong>Withdrawal of consent</strong> — withdraw consent for AI processing or data
              sharing at any time; this may limit some platform features
            </li>
            <li>
              <strong>Deletion</strong> — request deletion of your personal data via the "Delete my
              account" option in settings. We will process deletion requests within 30 days.
            </li>
            <li>
              <strong>Complaint</strong> — file a complaint with the Office of the Privacy
              Commissioner of Canada (OPC) at{" "}
              <a
                href="https://www.priv.gc.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                www.priv.gc.ca
              </a>
            </li>
          </ul>
          <p>
            To exercise your rights, contact us at{" "}
            <a href="mailto:privacy@onmatchhealth.ca" className="text-primary underline">
              privacy@onmatchhealth.ca
            </a>
            .
          </p>
        </PolicySection>

        <PolicySection title="5. Sensitive information — immigration and work authorization">
          <p>
            We treat your work authorization and immigration status as sensitive personal
            information subject to heightened protection:
          </p>
          <ul>
            <li>
              Your specific status is stored encrypted and is never shown to employers in search
              results
            </li>
            <li>
              Employers see only a derived indicator: "Work-authorized without sponsorship: yes/no"
              — and only when you have consented to sharing it
            </li>
            <li>
              We do not require you to disclose your status; "Prefer not to disclose" is a valid
              option
            </li>
            <li>
              Permanent residents have identical work rights to Canadian citizens and must not be
              treated differently by employers. The platform is designed to reflect this.
            </li>
          </ul>
        </PolicySection>

        <PolicySection title="6. Data retention">
          <p>
            We retain your personal information for as long as your account is active or as needed
            to provide services. If you request deletion, we will anonymize or delete your data
            within 30 days, except where retention is required by law.
          </p>
          <p>
            AI search session logs are retained for 12 months for bias auditing purposes, after
            which they are anonymized.
          </p>
        </PolicySection>

        <PolicySection title="7. Security">
          <p>
            We use industry-standard security measures including encryption in transit (TLS),
            encryption at rest for sensitive fields, Row Level Security (RLS) on all database
            tables, and role-based access controls. We follow responsible disclosure practices for
            security vulnerabilities.
          </p>
          <p>
            In the event of a data breach that creates real risk of significant harm to individuals,
            we will notify the Office of the Privacy Commissioner and affected users within 72
            hours, as required by PIPEDA.
          </p>
        </PolicySection>

        <PolicySection title="8. Cookies and tracking">
          <p>
            We use session cookies necessary for authentication. We do not use third-party
            advertising trackers or behavioural profiling cookies.
          </p>
        </PolicySection>

        <PolicySection title="9. Contact us">
          <p>
            For privacy questions or requests:
            <br />
            <strong>Email:</strong>{" "}
            <a href="mailto:privacy@onmatchhealth.ca" className="text-primary underline">
              privacy@onmatchhealth.ca
            </a>
            <br />
            <strong>Subject line:</strong> "Privacy Request — [your request type]"
          </p>
        </PolicySection>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
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
