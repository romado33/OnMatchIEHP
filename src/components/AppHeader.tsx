import { Link, useNavigate } from "@tanstack/react-router";
import { Stethoscope, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Stethoscope className="h-5 w-5 text-primary" /> OnMatch Health
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          <Link to="/profile"><Button variant="ghost" size="sm">My profile</Button></Link>
          <Link to="/search"><Button variant="ghost" size="sm">Find candidates</Button></Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}