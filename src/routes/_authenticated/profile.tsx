import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, X, CheckCircle2, Circle, Clock, AlertCircle, ExternalLink, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — OnMatch Health" }] }),
  component: ProfilePage,
});

// ── Reference data types ──────────────────────────────────────────────────

type RefProfession = { id: string; display_name: string; sort_order: number };
type RefSpecialty = { id: string; profession_id: string; display_name: string };
type RefCountry = { code: string; name: string };
type RefWorkAuth = { id: string; display_name: string; requires_sponsorship: boolean };
type RefLanguage = { code: string; name: string; native_name: string | null };
type RefRegion = { id: string; display_name: string };
type RefOrgType = { id: string; display_name: string };
type RefCredStep = {
  id: string;
  step_order: number;
  step_name: string;
  description: string | null;
  governing_body: string | null;
  typical_duration_weeks: number | null;
  cost_cad: number | null;
  info_url: string | null;
};
type CredRecord = {
  id?: string;
  step_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
};

// ── Profile page ──────────────────────────────────────────────────────────

function ProfilePage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();
      if (!data?.account_type) {
        navigate({ to: "/onboarding" });
        return;
      }
      setAccountType(data.account_type);
    })();
  }, [navigate]);

  if (!userId || !accountType) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {accountType === "professional" ? (
          <ProForm userId={userId} />
        ) : (
          <EmployerForm userId={userId} />
        )}
      </main>
    </div>
  );
}

// ── Client-side completeness score (mirrors calc_profile_completeness() in DB) ──

function calcCompleteness(
  p: ProState,
  langCount: number,
  credCompletedCount: number,
  credInProgressCount: number,
): number {
  let score = 0;
  if (p.profession || p.profession_id) score += 10;
  if (p.country_of_training || p.country_of_training_code) score += 8;
  if (p.years_experience > 0) score += 5;
  if (p.bio && p.bio.length > 50) score += 10;
  if (p.current_city) score += 5;
  if (p.available_from) score += 5;
  if (p.desired_employment_types.length > 0) score += 7;
  if (langCount >= 1) score += 8;
  if (langCount >= 2) score += 7;
  const credTotal = credCompletedCount + credInProgressCount;
  if (credTotal >= 1) score += 10;
  if (credTotal >= 3) score += 10;
  if (credTotal >= 5) score += 5;
  if (p.profession_id) score += 5;
  if (p.work_auth_type_id) score += 5;
  return Math.min(score, 100);
}

// ── Multi-select chip component ───────────────────────────────────────────

function MultiSelectChips({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = options.filter(
    (o) => !selected.includes(o.value) && o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 font-normal">
            <Plus className="h-3.5 w-3.5" />
            {placeholder ?? "Add…"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-52">
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {available.map((o) => (
                  <CommandItem
                    key={o.value}
                    onSelect={() => {
                      toggle(o.value);
                      setSearch("");
                    }}
                  >
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <Badge key={o.value} variant="secondary" className="gap-1 pr-1.5">
              {o.label}
              <button
                type="button"
                onClick={() => toggle(o.value)}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tags input for free-form items ────────────────────────────────────────

function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter…"}
          className="h-8 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={add}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1.5">
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Credential tracker ────────────────────────────────────────────────────

const CRED_STATUSES = [
  { value: "not_started", label: "Not started", icon: Circle, color: "text-muted-foreground" },
  { value: "in_progress", label: "In progress", icon: Clock, color: "text-blue-600" },
  { value: "submitted", label: "Submitted", icon: Clock, color: "text-amber-600" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-600" },
  { value: "failed", label: "Failed / Did not pass", icon: AlertCircle, color: "text-destructive" },
  { value: "waived", label: "Waived / Not required", icon: CheckCircle2, color: "text-muted-foreground" },
];

function CredentialTracker({
  professionId,
  userId,
  credRecords,
  onChange,
}: {
  professionId: string;
  userId: string;
  credRecords: CredRecord[];
  onChange: (records: CredRecord[]) => void;
}) {
  const [steps, setSteps] = useState<RefCredStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  useEffect(() => {
    if (!professionId) {
      setSteps([]);
      return;
    }
    setLoadingSteps(true);
    supabase
      .from("ref_credential_steps")
      .select("id, step_order, step_name, description, governing_body, typical_duration_weeks, cost_cad, info_url")
      .eq("profession_id", professionId)
      .order("step_order")
      .then(({ data }) => {
        setSteps((data as RefCredStep[]) ?? []);
        setLoadingSteps(false);
      });
  }, [professionId]);

  if (!professionId) return null;
  if (loadingSteps) return <p className="text-sm text-muted-foreground">Loading credential pathway…</p>;
  if (steps.length === 0) return (
    <p className="text-sm text-muted-foreground">
      No structured pathway available for this profession yet. Use the fields above to describe your
      credentials manually.
    </p>
  );

  const completedCount = credRecords.filter(
    (r) => r.status === "completed" || r.status === "waived",
  ).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  function getRecord(stepId: string): CredRecord {
    return (
      credRecords.find((r) => r.step_id === stepId) ?? {
        step_id: stepId,
        status: "not_started",
        started_at: null,
        completed_at: null,
      }
    );
  }

  function updateRecord(stepId: string, status: string) {
    const existing = credRecords.find((r) => r.step_id === stepId);
    const updated: CredRecord = existing
      ? { ...existing, status }
      : { step_id: stepId, status, started_at: null, completed_at: null };
    const rest = credRecords.filter((r) => r.step_id !== stepId);
    onChange([...rest, updated]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {completedCount} of {steps.length} steps complete
        </p>
        <span className="text-xs text-muted-foreground">{progressPct}%</span>
      </div>
      <Progress value={progressPct} className="h-1.5" />

      <div className="space-y-2">
        {steps.map((step) => {
          const record = getRecord(step.id);
          const statusMeta =
            CRED_STATUSES.find((s) => s.value === record.status) ?? CRED_STATUSES[0];
          const StatusIcon = statusMeta.icon;

          return (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${statusMeta.color}`} />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-snug">{step.step_name}</p>
                    {step.governing_body && (
                      <p className="text-xs text-muted-foreground">{step.governing_body}</p>
                    )}
                  </div>
                  <Select value={record.status} onValueChange={(v) => updateRecord(step.id, v)}>
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRED_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {step.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {step.typical_duration_weeks && (
                    <span>~{step.typical_duration_weeks} weeks</span>
                  )}
                  {step.cost_cad && <span>${step.cost_cad.toLocaleString()} CAD</span>}
                  {step.info_url && (
                    <a
                      href={step.info_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    >
                      Learn more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Professional profile form ─────────────────────────────────────────────

type ProState = {
  // Legacy text fields preserved for backward compatibility
  profession: string;
  specialty: string;
  country_of_training: string;
  years_experience: number;
  languages: string[];
  credentials_status: string;
  license_exam_status: string;
  work_authorization: string;
  currently_in_canada: boolean;
  current_city: string;
  preferred_cities: string[];
  willing_to_relocate: boolean;
  desired_role_types: string[];
  desired_employment_types: string[];
  available_from: string;
  bio: string;
  is_searchable: boolean;
  // New structured FK fields
  profession_id: string;
  specialty_id: string;
  country_of_training_code: string;
  work_auth_type_id: string;
  work_authorized_without_sponsorship: boolean | null;
  consent_work_auth_visible: boolean;
  preferred_region_ids: string[];
  linkedin_url: string;
  portfolio_url: string;
};

const emptyPro: ProState = {
  profession: "", specialty: "", country_of_training: "", years_experience: 0,
  languages: [], credentials_status: "", license_exam_status: "",
  work_authorization: "", currently_in_canada: false, current_city: "",
  preferred_cities: [], willing_to_relocate: false, desired_role_types: [],
  desired_employment_types: [], available_from: "", bio: "", is_searchable: true,
  profession_id: "", specialty_id: "", country_of_training_code: "",
  work_auth_type_id: "", work_authorized_without_sponsorship: null,
  consent_work_auth_visible: false, preferred_region_ids: [], linkedin_url: "", portfolio_url: "",
};

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "locum", label: "Locum" },
  { value: "contract", label: "Contract" },
  { value: "casual", label: "Casual / Per diem" },
];

function ProForm({ userId }: { userId: string }) {
  const [p, setP] = useState<ProState>(emptyPro);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credRecords, setCredRecords] = useState<CredRecord[]>([]);

  // Reference data
  const [professions, setProfessions] = useState<RefProfession[]>([]);
  const [specialties, setSpecialties] = useState<RefSpecialty[]>([]);
  const [countries, setCountries] = useState<RefCountry[]>([]);
  const [workAuthTypes, setWorkAuthTypes] = useState<RefWorkAuth[]>([]);
  const [languages, setLanguages] = useState<RefLanguage[]>([]);
  const [regions, setRegions] = useState<RefRegion[]>([]);

  useEffect(() => {
    async function load() {
      // Fetch profile + credential records + all reference data concurrently
      const [
        profileRes, credRes,
        profsRes, specsRes, countriesRes,
        workAuthRes, langsRes, regionsRes,
      ] = await Promise.all([
        supabase.from("professional_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("professional_credentials").select("step_id, status, started_at, completed_at").eq("user_id", userId),
        supabase.from("ref_professions").select("id, display_name, sort_order").order("sort_order"),
        supabase.from("ref_specialties").select("id, profession_id, display_name").order("sort_order"),
        supabase.from("ref_countries").select("code, name").order("name"),
        supabase.from("ref_work_auth_types").select("id, display_name, requires_sponsorship"),
        supabase.from("ref_languages").select("code, name, native_name").order("sort_order"),
        supabase.from("ref_ontario_regions").select("id, display_name").order("population_tier"),
      ]);

      setProfessions((profsRes.data as RefProfession[]) ?? []);
      setSpecialties((specsRes.data as RefSpecialty[]) ?? []);
      setCountries((countriesRes.data as RefCountry[]) ?? []);
      setWorkAuthTypes((workAuthRes.data as RefWorkAuth[]) ?? []);
      setLanguages((langsRes.data as RefLanguage[]) ?? []);
      setRegions((regionsRes.data as RefRegion[]) ?? []);
      setCredRecords((credRes.data as CredRecord[]) ?? []);

      if (profileRes.data) {
        const d = profileRes.data;
        setP({
          ...emptyPro,
          profession: d.profession ?? "",
          specialty: d.specialty ?? "",
          country_of_training: d.country_of_training ?? "",
          years_experience: d.years_experience ?? 0,
          languages: d.languages ?? [],
          credentials_status: d.credentials_status ?? "",
          license_exam_status: d.license_exam_status ?? "",
          work_authorization: d.work_authorization ?? "",
          currently_in_canada: d.currently_in_canada ?? false,
          current_city: d.current_city ?? "",
          preferred_cities: d.preferred_cities ?? [],
          willing_to_relocate: d.willing_to_relocate ?? false,
          desired_role_types: d.desired_role_types ?? [],
          desired_employment_types: d.desired_employment_types ?? [],
          available_from: d.available_from ?? "",
          bio: d.bio ?? "",
          is_searchable: d.is_searchable ?? true,
          profession_id: d.profession_id ?? "",
          specialty_id: d.specialty_id ?? "",
          country_of_training_code: d.country_of_training_code ?? "",
          work_auth_type_id: d.work_auth_type_id ?? "",
          work_authorized_without_sponsorship: d.work_authorized_without_sponsorship ?? null,
          consent_work_auth_visible: d.consent_work_auth_visible ?? false,
          preferred_region_ids: d.preferred_region_ids ?? [],
          linkedin_url: d.linkedin_url ?? "",
          portfolio_url: d.portfolio_url ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  function set<K extends keyof ProState>(k: K, v: ProState[K]) {
    setP((s) => ({ ...s, [k]: v }));
  }

  const filteredSpecialties = useMemo(
    () => specialties.filter((s) => s.profession_id === p.profession_id),
    [specialties, p.profession_id],
  );

  const completeness = useMemo(() => {
    const credCompleted = credRecords.filter(
      (r) => r.status === "completed" || r.status === "waived",
    ).length;
    const credInProgress = credRecords.filter((r) => r.status === "in_progress").length;
    return calcCompleteness(p, p.languages.length, credCompleted, credInProgress);
  }, [p, credRecords]);

  const completenessLabel =
    completeness < 40 ? "Add more details to appear in employer searches"
    : completeness < 70 ? "Good start — add credentials to improve your ranking"
    : completeness < 90 ? "Strong profile — add a bio and availability to finish"
    : "Excellent profile!";

  async function save() {
    if (!p.profession && !p.profession_id) {
      toast.error("Profession is required.");
      return;
    }
    if (!p.country_of_training && !p.country_of_training_code) {
      toast.error("Country of training is required.");
      return;
    }

    setSaving(true);

    const selectedProfession = professions.find((x) => x.id === p.profession_id);
    const selectedSpecialty = specialties.find((x) => x.id === p.specialty_id);
    const selectedCountry = countries.find((x) => x.code === p.country_of_training_code);
    const selectedWorkAuth = workAuthTypes.find((x) => x.id === p.work_auth_type_id);

    const payload = {
      user_id: userId,
      // Legacy text fields (kept for backward compat)
      profession: selectedProfession?.display_name ?? p.profession,
      specialty: (selectedSpecialty?.display_name ?? p.specialty) || null,
      country_of_training: selectedCountry?.name ?? p.country_of_training,
      years_experience: Number(p.years_experience) || 0,
      languages: p.languages,
      credentials_status: p.credentials_status || null,
      license_exam_status: p.license_exam_status || null,
      currently_in_canada: p.currently_in_canada,
      current_city: p.current_city || null,
      preferred_cities: p.preferred_cities,
      willing_to_relocate: p.willing_to_relocate,
      desired_role_types: p.desired_role_types,
      desired_employment_types: p.desired_employment_types,
      available_from: p.available_from || null,
      bio: p.bio || null,
      is_searchable: p.is_searchable,
      // New structured FK fields
      profession_id: p.profession_id || null,
      specialty_id: p.specialty_id || null,
      country_of_training_code: p.country_of_training_code || null,
      work_auth_type_id: p.work_auth_type_id || null,
      work_authorized_without_sponsorship: selectedWorkAuth
        ? !selectedWorkAuth.requires_sponsorship
        : null,
      consent_work_auth_visible: p.consent_work_auth_visible,
      preferred_region_ids: p.preferred_region_ids,
      linkedin_url: p.linkedin_url || null,
      portfolio_url: p.portfolio_url || null,
      completeness_score: completeness,
    };

    const { error: profileError } = await supabase
      .from("professional_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (profileError) {
      setSaving(false);
      toast.error(profileError.message);
      return;
    }

    // Save credential records
    if (credRecords.length > 0) {
      const credPayload = credRecords.map((r) => ({
        user_id: userId,
        step_id: r.step_id,
        status: r.status,
        started_at: r.started_at,
        completed_at: r.completed_at,
      }));
      await supabase
        .from("professional_credentials")
        .upsert(credPayload, { onConflict: "user_id,step_id" } as never);
    }

    setSaving(false);
    toast.success("Profile saved");
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const languageOptions = languages.map((l) => ({
    value: l.name,
    label: l.native_name ? `${l.name} (${l.native_name})` : l.name,
  }));

  const regionOptions = regions.map((r) => ({ value: r.id, label: r.display_name }));

  return (
    <div className="space-y-6">
      {/* Completeness bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Profile completeness</span>
            <span
              className={
                completeness >= 70 ? "text-emerald-600 font-semibold"
                : completeness >= 40 ? "text-amber-600 font-semibold"
                : "text-destructive font-semibold"
              }
            >
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{completenessLabel}</p>
          {completeness < 40 && (
            <p className="mt-1 text-xs text-destructive">
              Profiles below 40% do not appear in employer searches.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main form */}
      <Card>
        <CardHeader>
          <CardTitle>My professional profile</CardTitle>
          <CardDescription>
            The richer your profile, the better your AI matches. All fields are optional except
            profession and country of training.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Professional Info ──────────────────────────────── */}
            <TabsContent value="info" className="mt-6 space-y-5">
              <FormField label="Profession *">
                {professions.length > 0 ? (
                  <Select
                    value={p.profession_id}
                    onValueChange={(v) => {
                      const prof = professions.find((x) => x.id === v);
                      set("profession_id", v);
                      set("profession", prof?.display_name ?? "");
                      set("specialty_id", "");
                      set("specialty", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your profession…" />
                    </SelectTrigger>
                    <SelectContent>
                      {professions.map((pr) => (
                        <SelectItem key={pr.id} value={pr.id}>
                          {pr.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={p.profession}
                    onChange={(e) => set("profession", e.target.value)}
                    placeholder="e.g. Registered Nurse, Physician, PSW"
                  />
                )}
              </FormField>

              {(p.profession_id && filteredSpecialties.length > 0) && (
                <FormField label="Specialty / area of practice">
                  <Select
                    value={p.specialty_id}
                    onValueChange={(v) => {
                      const spec = specialties.find((x) => x.id === v);
                      set("specialty_id", v);
                      set("specialty", spec?.display_name ?? "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty…" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSpecialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              <FormField label="Country of training *">
                {countries.length > 0 ? (
                  <Select
                    value={p.country_of_training_code}
                    onValueChange={(v) => {
                      const c = countries.find((x) => x.code === v);
                      set("country_of_training_code", v);
                      set("country_of_training", c?.name ?? "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country…" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={p.country_of_training}
                    onChange={(e) => set("country_of_training", e.target.value)}
                    placeholder="e.g. Philippines, India, Nigeria"
                  />
                )}
              </FormField>

              <FormField label="Years of experience">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={p.years_experience}
                  onChange={(e) => set("years_experience", Number(e.target.value))}
                />
              </FormField>

              <FormField label="Languages spoken">
                {languages.length > 0 ? (
                  <MultiSelectChips
                    options={languageOptions}
                    selected={p.languages}
                    onChange={(v) => set("languages", v)}
                    placeholder="Add language…"
                  />
                ) : (
                  <Input
                    value={p.languages.join(", ")}
                    onChange={(e) =>
                      set("languages", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))
                    }
                    placeholder="English, Tagalog, Hindi…"
                  />
                )}
              </FormField>

              <FormField label="LinkedIn profile URL">
                <Input
                  type="url"
                  value={p.linkedin_url}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                />
              </FormField>

              <FormField label="About you">
                <Textarea
                  rows={5}
                  value={p.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Describe your clinical experience, achievements, and what you're looking for in Ontario…"
                  maxLength={2000}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {p.bio.length} / 2000
                </p>
              </FormField>
            </TabsContent>

            {/* ── Tab 2: Credentials ────────────────────────────────────── */}
            <TabsContent value="credentials" className="mt-6 space-y-5">
              <FormField
                label="Work authorization"
                hint="This information is for your reference only. Employers see only whether you require sponsorship — never your specific status."
              >
                {workAuthTypes.length > 0 ? (
                  <Select
                    value={p.work_auth_type_id}
                    onValueChange={(v) => set("work_auth_type_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your status…" />
                    </SelectTrigger>
                    <SelectContent>
                      {workAuthTypes.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={p.work_authorization}
                    onChange={(e) => set("work_authorization", e.target.value)}
                    placeholder="e.g. PR, Open work permit, Requires LMIA"
                  />
                )}
              </FormField>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm">Share work authorization status with employers</Label>
                  <p className="text-xs text-muted-foreground">
                    Only shows whether you require sponsorship — your specific status is never disclosed.
                  </p>
                </div>
                <Switch
                  checked={p.consent_work_auth_visible}
                  onCheckedChange={(v) => set("consent_work_auth_visible", v)}
                />
              </div>

              <FormField label="Available from">
                <Input
                  type="date"
                  value={p.available_from}
                  onChange={(e) => set("available_from", e.target.value)}
                />
              </FormField>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Credential pathway</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Track your progress through the Ontario registration process for your profession.
                  {!p.profession_id && " Select a profession in the Info tab to see your pathway."}
                </p>
                <CredentialTracker
                  professionId={p.profession_id}
                  userId={userId}
                  credRecords={credRecords}
                  onChange={setCredRecords}
                />
              </div>

              {/* Legacy free-text fallback (shown when ref tables not yet populated) */}
              {!p.profession_id && (
                <>
                  <FormField label="Credentials status (legacy)">
                    <Input
                      value={p.credentials_status}
                      onChange={(e) => set("credentials_status", e.target.value)}
                      placeholder="e.g. NNAS in progress, ECA complete"
                    />
                  </FormField>
                  <FormField label="Licensing exam status (legacy)">
                    <Input
                      value={p.license_exam_status}
                      onChange={(e) => set("license_exam_status", e.target.value)}
                      placeholder="e.g. NCLEX passed, MCCQE1 booked"
                    />
                  </FormField>
                </>
              )}
            </TabsContent>

            {/* ── Tab 3: Location ───────────────────────────────────────── */}
            <TabsContent value="location" className="mt-6 space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Currently living in Canada</Label>
                <Switch
                  checked={p.currently_in_canada}
                  onCheckedChange={(v) => set("currently_in_canada", v)}
                />
              </div>

              <FormField label="Current city">
                <Input
                  value={p.current_city}
                  onChange={(e) => set("current_city", e.target.value)}
                  placeholder="e.g. Toronto, Brampton, Mississauga"
                />
              </FormField>

              <FormField label="Preferred Ontario regions">
                {regions.length > 0 ? (
                  <MultiSelectChips
                    options={regionOptions}
                    selected={p.preferred_region_ids}
                    onChange={(v) => set("preferred_region_ids", v)}
                    placeholder="Add region…"
                  />
                ) : (
                  <Input
                    value={p.preferred_cities.join(", ")}
                    onChange={(e) =>
                      set("preferred_cities", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))
                    }
                    placeholder="Toronto, Hamilton, Ottawa…"
                  />
                )}
              </FormField>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Willing to relocate within Ontario</Label>
                <Switch
                  checked={p.willing_to_relocate}
                  onCheckedChange={(v) => set("willing_to_relocate", v)}
                />
              </div>
            </TabsContent>

            {/* ── Tab 4: Preferences ────────────────────────────────────── */}
            <TabsContent value="preferences" className="mt-6 space-y-5">
              <FormField label="Desired employment types">
                <MultiSelectChips
                  options={EMPLOYMENT_TYPES}
                  selected={p.desired_employment_types}
                  onChange={(v) => set("desired_employment_types", v)}
                  placeholder="Add type…"
                />
              </FormField>

              <FormField label="Desired role types">
                <TagsInput
                  value={p.desired_role_types}
                  onChange={(v) => set("desired_role_types", v)}
                  placeholder="e.g. ICU nurse, NP in family practice…"
                />
              </FormField>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Visible to employers (searchable)</Label>
                    <p className="text-xs text-muted-foreground">
                      When on, verified Ontario employers can find your profile in AI searches. You can
                      toggle this off at any time.
                    </p>
                    {!p.is_searchable && (
                      <p className="text-xs text-amber-600 font-medium">
                        Your profile is currently hidden from employer searches.
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={p.is_searchable}
                    onCheckedChange={(v) => set("is_searchable", v)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="mt-6 mb-4" />
          <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Employer profile form ─────────────────────────────────────────────────

type EmpState = {
  org_name: string;
  org_type: string;
  org_type_id: string;
  city: string;
  website: string;
  contact_name: string;
  contact_phone: string;
  about: string;
  linkedin_url: string;
  ontario_business_number: string;
  accepts_sponsored_workers: boolean;
  lmia_capable: boolean;
  verification_status: string;
};

const emptyEmp: EmpState = {
  org_name: "", org_type: "", org_type_id: "", city: "", website: "",
  contact_name: "", contact_phone: "", about: "", linkedin_url: "",
  ontario_business_number: "", accepts_sponsored_workers: false,
  lmia_capable: false, verification_status: "pending",
};

function EmployerForm({ userId }: { userId: string }) {
  const [e, setE] = useState<EmpState>(emptyEmp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgTypes, setOrgTypes] = useState<RefOrgType[]>([]);

  useEffect(() => {
    async function load() {
      const [profileRes, orgTypesRes] = await Promise.all([
        supabase.from("employer_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("ref_org_types").select("id, display_name").order("sort_order"),
      ]);

      setOrgTypes((orgTypesRes.data as RefOrgType[]) ?? []);

      if (profileRes.data) {
        const d = profileRes.data;
        setE({
          org_name: d.org_name ?? "",
          org_type: d.org_type ?? "",
          org_type_id: (d as Record<string, string>).org_type_id ?? "",
          city: d.city ?? "",
          website: d.website ?? "",
          contact_name: d.contact_name ?? "",
          contact_phone: d.contact_phone ?? "",
          about: d.about ?? "",
          linkedin_url: (d as Record<string, string>).linkedin_url ?? "",
          ontario_business_number: (d as Record<string, string>).ontario_business_number ?? "",
          accepts_sponsored_workers: (d as Record<string, boolean>).accepts_sponsored_workers ?? false,
          lmia_capable: (d as Record<string, boolean>).lmia_capable ?? false,
          verification_status: (d as Record<string, string>).verification_status ?? "pending",
        });
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  function set<K extends keyof EmpState>(k: K, v: EmpState[K]) {
    setE((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    if (!e.org_name.trim()) {
      toast.error("Organization name is required.");
      return;
    }
    setSaving(true);

    const selectedOrgType = orgTypes.find((o) => o.id === e.org_type_id);
    const payload = {
      user_id: userId,
      org_name: e.org_name,
      org_type: (selectedOrgType?.display_name ?? e.org_type) || null,
      org_type_id: e.org_type_id || null,
      city: e.city || null,
      website: e.website || null,
      contact_name: e.contact_name || null,
      contact_phone: e.contact_phone || null,
      about: e.about || null,
      linkedin_url: e.linkedin_url || null,
      ontario_business_number: e.ontario_business_number || null,
      accepts_sponsored_workers: e.accepts_sponsored_workers,
      lmia_capable: e.lmia_capable,
      // Submitting profile for the first time moves status to under_review
      verification_status:
        e.verification_status === "pending" ? "under_review" : e.verification_status,
    };

    const { error } = await supabase
      .from("employer_profiles")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (e.verification_status === "pending") {
      setE((s) => ({ ...s, verification_status: "under_review" }));
      toast.success(
        "Organization profile saved. Your account has been submitted for verification.",
      );
    } else {
      toast.success("Organization profile saved");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const verificationBadge =
    e.verification_status === "verified" ? (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Verified</Badge>
    ) : e.verification_status === "under_review" ? (
      <Badge variant="outline" className="border-amber-200 text-amber-700">Under review</Badge>
    ) : e.verification_status === "rejected" ? (
      <Badge variant="destructive">Rejected</Badge>
    ) : (
      <Badge variant="outline">Pending verification</Badge>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Organization profile</CardTitle>
            <CardDescription>
              Visible to candidates you contact. Complete this profile to request account
              verification and unlock candidate search.
            </CardDescription>
          </div>
          {verificationBadge}
        </div>
        {e.verification_status === "under_review" && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Your account is under review. We'll notify you by email once verified — typically within 1
            business day.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField label="Organization name *">
          <Input
            value={e.org_name}
            onChange={(ev) => set("org_name", ev.target.value)}
            placeholder="e.g. Sunnybrook Health Sciences Centre"
          />
        </FormField>

        <FormField label="Organization type">
          {orgTypes.length > 0 ? (
            <Select
              value={e.org_type_id}
              onValueChange={(v) => {
                const o = orgTypes.find((x) => x.id === v);
                set("org_type_id", v);
                set("org_type", o?.display_name ?? "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {orgTypes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={e.org_type}
              onChange={(ev) => set("org_type", ev.target.value)}
              placeholder="hospital, clinic, LTC, home care…"
            />
          )}
        </FormField>

        <FormField label="City">
          <Input
            value={e.city}
            onChange={(ev) => set("city", ev.target.value)}
            placeholder="e.g. Toronto"
          />
        </FormField>

        <FormField label="Website">
          <Input
            type="url"
            value={e.website}
            onChange={(ev) => set("website", ev.target.value)}
            placeholder="https://…"
          />
        </FormField>

        <FormField label="Ontario Business Registration Number (optional)">
          <Input
            value={e.ontario_business_number}
            onChange={(ev) => set("ontario_business_number", ev.target.value)}
            placeholder="Helps verify your organization"
          />
        </FormField>

        <Separator />

        <FormField label="HR contact name">
          <Input
            value={e.contact_name}
            onChange={(ev) => set("contact_name", ev.target.value)}
          />
        </FormField>

        <FormField label="HR contact phone">
          <Input
            type="tel"
            value={e.contact_phone}
            onChange={(ev) => set("contact_phone", ev.target.value)}
          />
        </FormField>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Open to sponsoring work permits</Label>
              <p className="text-xs text-muted-foreground">
                Indicates your organization can consider candidates who require employer sponsorship.
              </p>
            </div>
            <Switch
              checked={e.accepts_sponsored_workers}
              onCheckedChange={(v) => set("accepts_sponsored_workers", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">LMIA capable</Label>
              <p className="text-xs text-muted-foreground">
                Your organization has the capacity to obtain a Labour Market Impact Assessment.
              </p>
            </div>
            <Switch
              checked={e.lmia_capable}
              onCheckedChange={(v) => set("lmia_capable", v)}
            />
          </div>
        </div>

        <FormField label="About the organization">
          <Textarea
            rows={5}
            value={e.about}
            onChange={(ev) => set("about", ev.target.value)}
            placeholder="Tell candidates about your organization, culture, and the kinds of roles you hire for…"
          />
        </FormField>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save organization"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm">{label}</Label>
        {hint && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button">
                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs" side="top">
              {hint}
            </PopoverContent>
          </Popover>
        )}
      </div>
      {children}
    </div>
  );
}
