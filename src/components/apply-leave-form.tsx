"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { countDays, type LeaveBalance, type LeaveType } from "@/lib/leave";

const TYPE_LABELS: Record<LeaveType, string> = {
  CASUAL: "Casual",
  SICK: "Sick",
  EARNED: "Earned",
};
const LEAVE_TYPES = Object.keys(TYPE_LABELS) as LeaveType[];

/** Today's date in YYYY-MM-DD (UTC) — used as the date input's minimum */
const todayIso = new Date().toISOString().slice(0, 10);

export function ApplyLeaveForm({
  balances,
}: {
  balances: Record<LeaveType, LeaveBalance>;
}) {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  /* Live consequences: how many days this request uses, and what remains after */
  const days =
    startDate && endDate
      ? countDays(new Date(startDate), new Date(endDate))
      : 0;
  const selectedBalance = balances[type];
  const after = days > 0 ? selectedBalance.remaining - days : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, startDate, endDate, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not submit application");
        return;
      }
      toast.success("Leave applied — awaiting admin approval");
      setStartDate("");
      setEndDate("");
      setReason("");
      router.refresh(); // re-render server components with fresh data
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apply for leave</CardTitle>
        <CardDescription>
          Requests go to your admin for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Leave type</Label>
            <Select value={type} onValueChange={(v) => setType((v as LeaveType) ?? "CASUAL")}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]} · {balances[t].remaining} of {balances[t].entitlement} left
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startDate">From</Label>
              <Input
                id="startDate"
                type="date"
                min={todayIso}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">To</Label>
              <Input
                id="endDate"
                type="date"
                min={startDate || todayIso}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          {days > 0 && (
            <p className="text-xs text-zinc-500">
              {days} day{days === 1 ? "" : "s"}
              {after !== null && after < 0 && (
                <span className="font-medium text-amber-600">
                  {" "}· more than your {selectedBalance.remaining} remaining
                </span>
              )}
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Brief reason for your leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
