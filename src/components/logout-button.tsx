"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full navigation so the proxy re-evaluates the cleared cookie
    window.location.assign("/login");
  }

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="text-zinc-600">
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}
