import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDateRange, formatFull } from "@/lib/format";

export type LeaveRow = {
  id: number;
  type: string;
  startDate: Date | string;
  endDate: Date | string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date | string;
};

export function LeaveTable({ leaves }: { leaves: LeaveRow[] }) {
  if (leaves.length === 0) {
    return (
      <div className="h-full rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        No leave applications yet.
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/50">
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="text-center">Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied on</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id}>
              <TableCell className="font-medium capitalize">
                {leave.type.toLowerCase()}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateRange(leave.startDate, leave.endDate)}
              </TableCell>
              <TableCell className="text-center">{leave.days}</TableCell>
              <TableCell className="max-w-56 truncate text-zinc-500">
                {leave.reason}
              </TableCell>
              <TableCell>
                <StatusBadge status={leave.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-zinc-500">
                {formatFull(leave.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
