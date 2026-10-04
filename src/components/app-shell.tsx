import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogoutButton } from "@/components/logout-button";

/**
 * Shared top bar for authenticated pages. Server component — the only
 * interactive part (logout) is extracted into a client component.
 */
export function AppShell({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-md bg-zinc-900 text-white">
              <CalendarDays className="size-4" />
            </span>
            LeaveEase
          </div>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-zinc-500">
            Leave Management System
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium">{name}</span>
            <Badge
              variant="outline"
              className={role === "ADMIN" ? "border-zinc-900 text-zinc-900" : ""}
            >
              {role}
            </Badge>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
