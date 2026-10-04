"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // replace(), not assign(): swaps the current history entry (dashboard)
    // for /login, so browser Back has no authenticated page to restore —
    // covering both the router cache and the back-forward cache.
    window.location.replace("/login");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      className="text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}
