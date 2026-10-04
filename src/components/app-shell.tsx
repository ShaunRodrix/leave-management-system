import { CalendarDays } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { BfcacheReload } from "@/components/bfcache-reload";

/**
 * Shared top bar for authenticated pages. Server component — the only
 * interactive part (logout) is extracted into a client component.
 *
 * Dark chrome. Identity block on the right: avatar initial, name and
 * role stacked. `name` is the session email; the person-readable name
 * is derived from it (shaun@company.com -> Shaun) since accounts don't
 * carry a separate display name.
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
  const handle = name.split("@")[0];
  const displayName = handle.charAt(0).toUpperCase() + handle.slice(1);

  return (
    <div className="flex min-h-screen flex-col">
      <BfcacheReload />
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-900">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white">
              <CalendarDays className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              LeaveEase
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2.5" title={name}>
              <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[12.5px] font-semibold text-white">
                {handle.charAt(0).toUpperCase()}
              </span>
              <span className="leading-tight">
                <span className="block text-[13px] font-medium text-white">{displayName}</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                  {role}
                </span>
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
