import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle();
      if (!data?.account_type) { navigate({ to: "/onboarding" }); return; }
      setAccountType(data.account_type);
    })();
  }, [navigate]);

  if (!userId || !accountType) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {accountType === "professional" ? <ProForm userId={userId} /> : <EmployerForm userId={userId} />}
      </main>
    </div>
  );
}

type Pro = {
  profession: string;
  specialty: string;
  country_of_training: string;
  years_experience: number;
  languages: string;
  credentials_status: string;
  license_exam_status: string;
  work_authorization: string;
  currently_in_canada: boolean;
  current_city: string;
  preferred_cities: string;
  willing_to_relocate: boolean;
  desired_role_types: string;
  desired_employment_types: string;
  available_from: string;
  bio: string;
  is_searchable: boolean;
};

const emptyPro: Pro = {
  profession: "", specialty: "", country_of_training: "", years_experience: 0,
  languages: "", credentials_status: "", license_exam_status: "", work_authorization: "",
  currently_in_canada: false, current_city: "", preferred_cities: "", willing_to_relocate: false,
  desired_role_types: "", desired_employment_types: "", available_from: "", bio: "", is_searchable: true,
};

function ProForm({ userId }: { userId: string }) {
  const [p, setP] = useState<Pro>(emptyPro);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("professional_profiles").select("*").eq("user_id", userId).maybeSingle();
      if (data) {
        setP({
          ...emptyPro,
          profession: data.profession ?? "",
          specialty: data.specialty ?? "",
          country_of_training: data.country_of_training ?? "",
          years_experience: data.years_experience ?? 0,
          credentials_status: data.credentials_status ?? "",
          license_exam_status: data.license_exam_status ?? "",
          work_authorization: data.work_authorization ?? "",
          currently_in_canada: data.currently_in_canada ?? false,
          current_city: data.current_city ?? "",
          willing_to_relocate: data.willing_to_relocate ?? false,
          bio: data.bio ?? "",
          is_searchable: data.is_searchable ?? true,
          languages: (data.languages ?? []).join(", "),
          preferred_cities: (data.preferred_cities ?? []).join(", "),
          desired_role_types: (data.desired_role_types ?? []).join(", "),
          desired_employment_types: (data.desired_employment_types ?? []).join(", "),
          available_from: data.available_from ?? "",
        });
      }
      setLoading(false);
    })();
  }, [userId]);

  function set<K extends keyof Pro>(k: K, v: Pro[K]) { setP((s) => ({ ...s, [k]: v })); }
  function arr(s: string) { return s.split(",").map((x) => x.trim()).filter(Boolean); }

  async function save() {
    setSaving(true);
    const payload = {
      user_id: userId,
      profession: p.profession,
      specialty: p.specialty || null,
      country_of_training: p.country_of_training,
      years_experience: Number(p.years_experience) || 0,
      languages: arr(p.languages),
      credentials_status: p.credentials_status || null,
      license_exam_status: p.license_exam_status || null,
      work_authorization: p.work_authorization || null,
      currently_in_canada: p.currently_in_canada,
      current_city: p.current_city || null,
      preferred_cities: arr(p.preferred_cities),
      willing_to_relocate: p.willing_to_relocate,
      desired_role_types: arr(p.desired_role_types),
      desired_employment_types: arr(p.desired_employment_types),
      available_from: p.available_from || null,
      bio: p.bio || null,
      is_searchable: p.is_searchable,
    };
    const { error } = await supabase.from("professional_profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My professional profile</CardTitle>
        <CardDescription>The richer your profile, the better your AI matches.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row><F label="Profession (e.g. Registered Nurse, Physician, PSW)" value={p.profession} onChange={(v) => set("profession", v)} /></Row>
        <Row><F label="Specialty / area of practice" value={p.specialty} onChange={(v) => set("specialty", v)} /></Row>
        <Row><F label="Country of training" value={p.country_of_training} onChange={(v) => set("country_of_training", v)} /></Row>
        <Row><F label="Years of experience" type="number" value={String(p.years_experience)} onChange={(v) => set("years_experience", Number(v))} /></Row>
        <Row><F label="Languages (comma separated)" value={p.languages} onChange={(v) => set("languages", v)} /></Row>
        <Row><F label="Credentials status (e.g. NNAS in progress, ECA complete)" value={p.credentials_status} onChange={(v) => set("credentials_status", v)} /></Row>
        <Row><F label="Licensing exam status (e.g. NCLEX passed, MCCQE1 booked)" value={p.license_exam_status} onChange={(v) => set("license_exam_status", v)} /></Row>
        <Row><F label="Work authorization (e.g. PR, Open work permit, Need sponsorship)" value={p.work_authorization} onChange={(v) => set("work_authorization", v)} /></Row>
        <Toggle label="Currently living in Canada" checked={p.currently_in_canada} onChange={(v) => set("currently_in_canada", v)} />
        <Row><F label="Current city" value={p.current_city} onChange={(v) => set("current_city", v)} /></Row>
        <Row><F label="Preferred Ontario cities (comma separated)" value={p.preferred_cities} onChange={(v) => set("preferred_cities", v)} /></Row>
        <Toggle label="Willing to relocate within Ontario" checked={p.willing_to_relocate} onChange={(v) => set("willing_to_relocate", v)} />
        <Row><F label="Desired role types (comma separated, e.g. ICU nurse, Family practice)" value={p.desired_role_types} onChange={(v) => set("desired_role_types", v)} /></Row>
        <Row><F label="Desired employment types (full-time, part-time, locum, contract)" value={p.desired_employment_types} onChange={(v) => set("desired_employment_types", v)} /></Row>
        <Row><F label="Available from" type="date" value={p.available_from} onChange={(v) => set("available_from", v)} /></Row>
        <div>
          <Label>About you (achievements, what you're looking for)</Label>
          <Textarea rows={5} value={p.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <Toggle label="Visible to employers (searchable)" checked={p.is_searchable} onChange={(v) => set("is_searchable", v)} />
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
      </CardContent>
    </Card>
  );
}

function EmployerForm({ userId }: { userId: string }) {
  const [e, setE] = useState({ org_name: "", org_type: "", city: "", website: "", contact_name: "", contact_phone: "", about: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("employer_profiles").select("*").eq("user_id", userId).maybeSingle();
      if (data) setE({
        org_name: data.org_name ?? "", org_type: data.org_type ?? "", city: data.city ?? "",
        website: data.website ?? "", contact_name: data.contact_name ?? "",
        contact_phone: data.contact_phone ?? "", about: data.about ?? "",
      });
      setLoading(false);
    })();
  }, [userId]);

  function set<K extends keyof typeof e>(k: K, v: (typeof e)[K]) { setE((s) => ({ ...s, [k]: v })); }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("employer_profiles").upsert({ user_id: userId, ...e }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Organization saved");
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization profile</CardTitle>
        <CardDescription>Visible to candidates you contact.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row><F label="Organization name" value={e.org_name} onChange={(v) => set("org_name", v)} /></Row>
        <Row><F label="Type (hospital, clinic, LTC, home care, public health)" value={e.org_type} onChange={(v) => set("org_type", v)} /></Row>
        <Row><F label="City" value={e.city} onChange={(v) => set("city", v)} /></Row>
        <Row><F label="Website" value={e.website} onChange={(v) => set("website", v)} /></Row>
        <Row><F label="Contact name" value={e.contact_name} onChange={(v) => set("contact_name", v)} /></Row>
        <Row><F label="Contact phone" value={e.contact_phone} onChange={(v) => set("contact_phone", v)} /></Row>
        <div>
          <Label>About the organization</Label>
          <Textarea rows={5} value={e.about} onChange={(ev) => set("about", ev.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save organization"}</Button>
      </CardContent>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
function F({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}