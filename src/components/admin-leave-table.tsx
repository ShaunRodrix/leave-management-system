"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { formatDateRange, formatFull } from "@/lib/format";

type AdminLeave = {
  id: number;
  type: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
  user: { id: number; name: string; email: string };
};

const FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export function AdminLeaveTable({ leaves }: { leaves: AdminLeave[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);

  const visible =
    filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);

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
      <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f}>
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No {filter === "ALL" ? "" : filter.toLowerCase() + " "}requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div className="font-medium">{leave.user.name}</div>
                    <div className="text-xs text-zinc-400">{leave.user.email}</div>
                  </TableCell>
                  <TableCell className="font-medium capitalize">
                    {leave.type.toLowerCase()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateRange(leave.startDate, leave.endDate)}
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
                    {leave.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
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
                    ) : (
                      <span className="text-xs text-zinc-400">Reviewed</span>
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
