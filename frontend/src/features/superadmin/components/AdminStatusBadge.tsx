import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/Badge";

export function AdminStatusBadge({ isApproved }: { isApproved: boolean }) {
  return isApproved ? (
    <Badge icon={<CheckCircle2 aria-hidden="true" size={14} />} variant="success">Approved</Badge>
  ) : (
    <Badge icon={<Clock3 aria-hidden="true" size={14} />} variant="warning">Not approved</Badge>
  );
}
