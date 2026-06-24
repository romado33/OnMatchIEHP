import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({ meta: [{ title: "Job Postings — OnMatch Health" }] }),
  component: JobsPage,
});

type JobPosting = {
  id: string;
  employer_id: string;
  title: string;
  profession: string;
  specialty: string | null;
  city: string | null;
  employment_type: string | null;
  description: string | null;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  open_to_sponsorship: boolean;
  requires_current_registration: boolean;
  application_deadline: string | null;
  positions_available: number;
  remote_possible: boolean;
  profession_id: string | null;
  specialty_id: string | null;
  region_id: string | null;
  application_count: number;
};

type RefProfession = { id: string; display_name: string };
type RefSpecialty = { id: string; profession_id: string; display_name: string };
type RefRegion = { id: string; display_name: string };

const EMPLOYMENT_TYPES = [
  "Full-time", "Part-time", "Locum", "Contract", "Casual / Per diem",
];

const emptyJob: Omit<JobPosting, "id" | "employer_id" | "created_at" | "application_count"> = {
  title: "", profession: "", specialty: null, city: null, employment_type: null,
  description: null, requirements: null, is_active: true, salary_min: null,
  salary_max: null, salary_period: null, open_to_sponsorship: false,
  requires_current_registration: true, application_deadline: null,
  positions_available: 1, remote_possible: false,
  profession_id: null, specialty_id: null, region_id: null,
};

function JobsPage() {
  const [accountType, setAccountType] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setAccountType(data?.account_type ?? null);
          setLoading(false);
        });
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {accountType === "employer" ? (
          <EmployerJobsView userId={userId} />
        ) : (
          <ProfessionalJobsView />
        )}
      </main>
    </div>
  );
}

// ── Employer: manage their own postings ───────────────────────────────────

function EmployerJobsView({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [professions, setProfessions] = useState<RefProfession[]>([]);
  const [specialties, setSpecialties] = useState<RefSpecialty[]>([]);
  const [regions, setRegions] = useState<RefRegion[]>([]);

  useEffect(() => {
    async function load() {
      const [jobsRes, profsRes, specsRes, regionsRes] = await Promise.all([
        supabase
          .from("job_postings")
          .select("*")
          .eq("employer_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("ref_professions").select("id, display_name").order("sort_order"),
        supabase.from("ref_specialties").select("id, profession_id, display_name"),
        supabase.from("ref_ontario_regions").select("id, display_name").order("population_tier"),
      ]);
      setJobs((jobsRes.data as JobPosting[]) ?? []);
      setProfessions((profsRes.data as RefProfession[]) ?? []);
      setSpecialties((specsRes.data as RefSpecialty[]) ?? []);
      setRegions((regionsRes.data as RefRegion[]) ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(job: JobPosting) {
    setEditing(job);
    setDialogOpen(true);
  }

  async function toggleActive(job: JobPosting) {
    const { error } = await supabase
      .from("job_postings")
      .update({ is_active: !job.is_active })
      .eq("id", job.id);
    if (error) { toast.error(error.message); return; }
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
    toast.success(job.is_active ? "Posting archived" : "Posting activated");
  }

  async function handleSave(
    form: typeof emptyJob & { id?: string },
  ) {
    const isNew = !form.id;
    const payload = { ...form, employer_id: userId };

    let error;
    if (isNew) {
      const res = await supabase.from("job_postings").insert(payload).select().single();
      error = res.error;
      if (!error && res.data) setJobs((prev) => [res.data as JobPosting, ...prev]);
    } else {
      const res = await supabase
        .from("job_postings")
        .update(payload)
        .eq("id", form.id!)
        .select()
        .single();
      error = res.error;
      if (!error && res.data)
        setJobs((prev) => prev.map((j) => j.id === form.id ? res.data as JobPosting : j));
    }

    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? "Job posting created" : "Job posting updated");
    setDialogOpen(false);
  }

  const visible = jobs.filter((j) => showArchived || j.is_active);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job postings</h1>
          <p className="mt-1 text-muted-foreground">
            {jobs.filter((j) => j.is_active).length} active{" "}
            {jobs.filter((j) => !j.is_active).length > 0 && `· ${jobs.filter((j) => !j.is_active).length} archived`}
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> New posting
        </Button>
      </div>

      {jobs.filter((j) => !j.is_active).length > 0 && (
        <div className="flex items-center gap-2">
          <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="show-archived" className="cursor-pointer text-sm">Show archived postings</Label>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No job postings yet</h2>
          <p className="max-w-sm text-muted-foreground">
            Create your first posting to let professionals know about open roles at your organization.
          </p>
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create first posting
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={job}
              onEdit={() => openEdit(job)}
              onToggleActive={() => toggleActive(job)}
            />
          ))}
        </div>
      )}

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        professions={professions}
        specialties={specialties}
        regions={regions}
        onSave={handleSave}
      />
    </div>
  );
}

function EmployerJobCard({
  job,
  onEdit,
  onToggleActive,
}: {
  job: JobPosting;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card className={job.is_active ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {job.title}
              <Badge variant={job.is_active ? "default" : "secondary"} className="text-xs">
                {job.is_active ? "Active" : "Archived"}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span>{job.profession}</span>
              {job.specialty && <span>· {job.specialty}</span>}
              {job.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}</span>}
              {job.employment_type && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.employment_type}</span>}
              {job.salary_min && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.salary_min.toLocaleString()}
                  {job.salary_max ? `–${job.salary_max.toLocaleString()}` : "+"}{" "}
                  {job.salary_period === "hourly" ? "/hr" : "/yr"}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleActive}
              className="text-muted-foreground"
            >
              {job.is_active ? "Archive" : "Activate"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{job.application_count ?? 0} applications</span>
          {job.open_to_sponsorship && <Badge variant="outline" className="text-xs">Open to sponsorship</Badge>}
          {job.remote_possible && <Badge variant="outline" className="text-xs">Remote possible</Badge>}
          {job.application_deadline && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Deadline: {new Date(job.application_deadline).toLocaleDateString("en-CA")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Job form dialog ───────────────────────────────────────────────────────

function JobFormDialog({
  open,
  onOpenChange,
  initial,
  professions,
  specialties,
  regions,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: JobPosting | null;
  professions: RefProfession[];
  specialties: RefSpecialty[];
  regions: RefRegion[];
  onSave: (form: typeof emptyJob & { id?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...emptyJob });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        profession: initial.profession,
        specialty: initial.specialty,
        city: initial.city,
        employment_type: initial.employment_type,
        description: initial.description,
        requirements: initial.requirements,
        is_active: initial.is_active,
        salary_min: initial.salary_min,
        salary_max: initial.salary_max,
        salary_period: initial.salary_period,
        open_to_sponsorship: initial.open_to_sponsorship,
        requires_current_registration: initial.requires_current_registration,
        application_deadline: initial.application_deadline,
        positions_available: initial.positions_available,
        remote_possible: initial.remote_possible,
        profession_id: initial.profession_id,
        specialty_id: initial.specialty_id,
        region_id: initial.region_id,
        id: initial.id,
      } as typeof emptyJob & { id?: string });
    } else {
      setForm({ ...emptyJob });
    }
  }, [initial, open]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit() {
    if (!form.title.trim()) { toast.error("Job title is required."); return; }
    if (!form.profession.trim()) { toast.error("Profession is required."); return; }
    setSaving(true);
    await onSave(form as typeof emptyJob & { id?: string });
    setSaving(false);
  }

  const filteredSpecs = specialties.filter((s) => s.profession_id === form.profession_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit job posting" : "New job posting"}</DialogTitle>
          <DialogDescription>
            Fields marked with * are required. Postings are visible to all professionals once active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FField label="Job title *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Registered Nurse — ICU" />
          </FField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FField label="Profession *">
              {professions.length > 0 ? (
                <Select value={form.profession_id ?? ""} onValueChange={(v) => {
                  const p = professions.find((x) => x.id === v);
                  set("profession_id", v);
                  set("profession", p?.display_name ?? "");
                  set("specialty_id", null);
                  set("specialty", null);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{professions.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={form.profession} onChange={(e) => set("profession", e.target.value)} placeholder="e.g. Registered Nurse" />
              )}
            </FField>

            {filteredSpecs.length > 0 && (
              <FField label="Specialty">
                <Select value={form.specialty_id ?? ""} onValueChange={(v) => {
                  const s = specialties.find((x) => x.id === v);
                  set("specialty_id", v);
                  set("specialty", s?.display_name ?? null);
                }}>
                  <SelectTrigger><SelectValue placeholder="Any specialty" /></SelectTrigger>
                  <SelectContent>{filteredSpecs.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>)}</SelectContent>
                </Select>
              </FField>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FField label="Region / city">
              {regions.length > 0 ? (
                <Select value={form.region_id ?? ""} onValueChange={(v) => {
                  const r = regions.find((x) => x.id === v);
                  set("region_id", v);
                  set("city", r?.display_name ?? null);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select region…" /></SelectTrigger>
                  <SelectContent>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.display_name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value || null)} placeholder="e.g. Toronto" />
              )}
            </FField>

            <FField label="Employment type">
              <Select value={form.employment_type ?? ""} onValueChange={(v) => set("employment_type", v || null)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </FField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FField label="Salary minimum">
              <Input type="number" value={form.salary_min ?? ""} onChange={(e) => set("salary_min", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 80000" />
            </FField>
            <FField label="Salary maximum">
              <Input type="number" value={form.salary_max ?? ""} onChange={(e) => set("salary_max", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 100000" />
            </FField>
            <FField label="Period">
              <Select value={form.salary_period ?? ""} onValueChange={(v) => set("salary_period", v || null)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </FField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FField label="Application deadline">
              <Input type="date" value={form.application_deadline ?? ""} onChange={(e) => set("application_deadline", e.target.value || null)} />
            </FField>
            <FField label="Positions available">
              <Input type="number" min={1} value={form.positions_available} onChange={(e) => set("positions_available", Number(e.target.value) || 1)} />
            </FField>
          </div>

          <FField label="Job description">
            <Textarea rows={4} value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} placeholder="Describe the role, responsibilities, and work environment…" />
          </FField>

          <FField label="Requirements">
            <Textarea rows={3} value={form.requirements ?? ""} onChange={(e) => set("requirements", e.target.value || null)} placeholder="Required qualifications, certifications, experience…" />
          </FField>

          <Separator />

          <div className="space-y-3">
            <ToggleRow
              label="Requires current Ontario registration"
              description="Candidate must be registered with the relevant regulatory college to be considered."
              checked={form.requires_current_registration}
              onChange={(v) => set("requires_current_registration", v)}
            />
            <ToggleRow
              label="Open to candidates requiring sponsorship"
              description="Your organization can provide LMIA support or employer-specific permit sponsorship if needed."
              checked={form.open_to_sponsorship}
              onChange={(v) => set("open_to_sponsorship", v)}
            />
            <ToggleRow
              label="Remote work possible"
              checked={form.remote_possible}
              onChange={(v) => set("remote_possible", v)}
            />
            <ToggleRow
              label="Active (visible to professionals)"
              checked={form.is_active}
              onChange={(v) => set("is_active", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save posting"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Professional: browse active postings ──────────────────────────────────

function ProfessionalJobsView() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProfId, setFilterProfId] = useState("");
  const [filterRegionId, setFilterRegionId] = useState("");
  const [professions, setProfessions] = useState<RefProfession[]>([]);
  const [regions, setRegions] = useState<RefRegion[]>([]);

  useEffect(() => {
    async function load() {
      const [jobsRes, profsRes, regionsRes] = await Promise.all([
        supabase
          .from("job_postings")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("ref_professions").select("id, display_name").order("sort_order"),
        supabase.from("ref_ontario_regions").select("id, display_name").order("population_tier"),
      ]);
      setJobs((jobsRes.data as JobPosting[]) ?? []);
      setProfessions((profsRes.data as RefProfession[]) ?? []);
      setRegions((regionsRes.data as RefRegion[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = jobs.filter((j) => {
    if (filterProfId && j.profession_id !== filterProfId) return false;
    if (filterRegionId && j.region_id !== filterRegionId) return false;
    return true;
  });

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available positions</h1>
        <p className="mt-1 text-muted-foreground">
          {filtered.length} active posting{filtered.length !== 1 ? "s" : ""} from verified Ontario employers.
        </p>
      </div>

      {/* Filters */}
      {(professions.length > 0 || regions.length > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {professions.length > 0 && (
            <Select value={filterProfId} onValueChange={setFilterProfId}>
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue placeholder="All professions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All professions</SelectItem>
                {professions.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {regions.length > 0 && (
            <Select value={filterRegionId} onValueChange={setFilterRegionId}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All regions</SelectItem>
                {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(filterProfId || filterRegionId) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterProfId(""); setFilterRegionId(""); }}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No postings match your filters</h2>
          <p className="text-muted-foreground">Try broadening your filters or check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => <ProfessionalJobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}

function ProfessionalJobCard({ job }: { job: JobPosting }) {
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function apply() {
    setApplying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setApplying(false); return; }
    const { error } = await supabase
      .from("applications")
      .insert({ job_posting_id: job.id, applicant_user_id: user.id });
    setApplying(false);
    if (error && error.code === "23505") {
      toast.info("You've already applied to this posting.");
      setApplied(true);
      return;
    }
    if (error) { toast.error(error.message); return; }
    setApplied(true);
    toast.success("Application submitted!");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{job.title}</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              <span>{job.profession}{job.specialty ? ` · ${job.specialty}` : ""}</span>
              {job.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}</span>}
              {job.employment_type && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.employment_type}</span>}
              {job.salary_min && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${job.salary_min.toLocaleString()}{job.salary_max ? `–$${job.salary_max.toLocaleString()}` : "+"} {job.salary_period === "hourly" ? "/hr" : "/yr"}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            {applied ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Applied</Badge>
            ) : (
              <Button size="sm" onClick={apply} disabled={applying}>
                {applying ? "Submitting…" : "Apply"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {job.open_to_sponsorship && <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">Open to sponsorship</Badge>}
          {!job.requires_current_registration && <Badge variant="outline" className="text-xs">Registration in progress accepted</Badge>}
          {job.remote_possible && <Badge variant="outline" className="text-xs">Remote possible</Badge>}
          {job.application_deadline && (
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Deadline {new Date(job.application_deadline).toLocaleDateString("en-CA")}
            </Badge>
          )}
        </div>

        {job.description && (
          <div>
            <p className={`text-sm text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}>
              {job.description}
            </p>
            {job.description.length > 200 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-xs text-primary hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label className="text-sm">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}
