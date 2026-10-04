"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { formatDateRange } from "@/lib/format";

type AdminLeave = {
  id: number;
  type: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
  user: { id: number; name: string; email: string; employeeId: number };
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

/** "starts today" / "in 3 days" / "already started" — decision context for pending rows */
function startLabel(startDate: Date | string): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diff = Math.round((new Date(startDate).getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "already started";
  if (diff === 0) return "starts today";
  if (diff === 1) return "starts tomorrow";
  return `starts in ${diff} days`;
}

export function AdminLeaveTable({ leaves }: { leaves: AdminLeave[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /* ⌘K / Ctrl+K jumps to search */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const searched = q
    ? leaves.filter(
        (l) =>
          String(l.user.employeeId).includes(q) ||
          l.user.name.toLowerCase().includes(q) ||
          l.user.email.toLowerCase().includes(q)
      )
    : leaves;

  const visible =
    filter === "ALL" ? searched : searched.filter((l) => l.status === filter);

  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f,
      f === "ALL" ? searched.length : searched.filter((l) => l.status === f).length,
    ])
  ) as Record<(typeof FILTERS)[number], number>;

  async function review(id: number, action: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not update request");
        return;
      }
      toast.success(action === "APPROVED" ? "Request approved" : "Request rejected");
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                <span
                  className={`ml-1 text-xs tabular-nums ${
                    f === "PENDING" && counts[f] > 0 ? "font-medium text-amber-600" : "text-zinc-400"
                  }`}
                >
                  {counts[f]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID or name…"
            className="pr-12 pl-8"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          {q
            ? `No results for "${query}".`
            : `No ${filter === "ALL" ? "" : filter.toLowerCase() + " "}requests.`}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead className="w-14">ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="tabular-nums text-zinc-500">
                    {leave.user.employeeId}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{leave.user.name}</div>
                    <div className="text-xs text-zinc-400">{leave.user.email}</div>
                  </TableCell>
                  <TableCell className="font-medium capitalize">
                    {leave.type.toLowerCase()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateRange(leave.startDate, leave.endDate)}
                    {leave.status === "PENDING" && (
                      <span className="mt-0.5 inline-block rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-700">
                        {startLabel(leave.startDate)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{leave.days}</TableCell>
                  <TableCell className="max-w-52">
                    <Dialog>
                      <DialogTrigger className="max-w-52 truncate text-left text-zinc-500 hover:text-zinc-900 hover:underline">
                        {leave.reason}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {leave.user.name} — {leave.type.toLowerCase()} leave
                          </DialogTitle>
                          <DialogDescription>
                            {formatDateRange(leave.startDate, leave.endDate)} ·{" "}
                            {leave.days} day{leave.days === 1 ? "" : "s"}
                          </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-zinc-600">{leave.reason}</p>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={leave.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === "PENDING" && (
                      <div className="flex justify-start gap-2">
                        <Button
                          size="sm"
                          onClick={() => review(leave.id, "APPROVED")}
                          disabled={busyId === leave.id}
                        >
                          {busyId === leave.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => review(leave.id, "REJECTED")}
                          disabled={busyId === leave.id}
                        >
                          <X className="size-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
