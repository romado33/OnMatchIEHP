import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
};

export function AppHeader() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Load account type for role-based nav
      supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setAccountType(data?.account_type ?? null));

      // Load recent unread notifications — gracefully skip if table not yet migrated
      supabase
        .from("notifications")
        .select("id, type, title, body, action_url, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15)
        .then(({ data }) => setNotifications((data as Notification[]) ?? []));
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Stethoscope className="h-5 w-5 text-primary" />
          <span className="hidden lg:inline">Ontario IEHP Workforce Integration Registry</span>
          <span className="lg:hidden">OIWIR</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <Link to="/profile">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {accountType === "employer" ? "Org profile" : "My profile"}
              </span>
            </Button>
          </Link>

          {/* Professionals: browse job postings */}
          {accountType === "professional" && (
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Browse jobs</span>
              </Button>
            </Link>
          )}

          {/* Employers: manage postings + candidate search */}
          {accountType === "employer" && (
            <>
              <Link to="/jobs">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Job postings</span>
                </Button>
              </Link>
              <Link to="/search">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Find candidates</span>
                </Button>
              </Link>
            </>
          )}

          {/* Notification bell */}
          <Popover
            open={notifOpen}
            onOpenChange={(v) => {
              setNotifOpen(v);
              if (v) markAllRead();
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <Separator />
              <ScrollArea className="h-72">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <NotifRow key={n.id} n={n} onNavigate={() => setNotifOpen(false)} />
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}

function NotifRow({ n, onNavigate }: { n: Notification; onNavigate: () => void }) {
  const navigate = useNavigate();

  function handleClick() {
    onNavigate();
    if (n.action_url) navigate({ to: n.action_url as never });
  }

  const timeAgo = (() => {
    const diff = Date.now() - new Date(n.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <button
      onClick={handleClick}
      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${!n.is_read ? "bg-primary/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${!n.is_read ? "font-medium" : "font-normal"}`}>{n.title}</p>
        {!n.is_read && <Badge variant="default" className="h-1.5 w-1.5 shrink-0 rounded-full p-0" />}
      </div>
      {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
      <p className="text-[11px] text-muted-foreground/70">{timeAgo}</p>
    </button>
  );
}
