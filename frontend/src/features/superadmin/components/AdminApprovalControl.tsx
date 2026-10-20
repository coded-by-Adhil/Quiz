import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Switch } from "@/components/Switch";
import { useToast } from "@/components/useToast";
import { useSetAdminApprovalMutation } from "@/features/superadmin/hooks/useSuperAdminQueries";
import type { PlatformAdmin } from "@/features/superadmin/types";
import { normalizeError } from "@/lib/normalizeError";

interface AdminApprovalControlProps {
  admin: PlatformAdmin;
  onMissing?: () => void;
}

export function AdminApprovalControl({ admin, onMissing }: AdminApprovalControlProps) {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const mutation = useSetAdminApprovalMutation();
  const { showToast } = useToast();
  const isPending = mutation.isPending && mutation.variables?.id === admin.id;

  const applyApproval = async (isApproved: boolean) => {
    try {
      await mutation.mutateAsync({ id: admin.id, isApproved });
      showToast({
        message: isApproved ? `${admin.name} is approved.` : `${admin.name} has been suspended.`,
        variant: "success",
      });
      setSuspendOpen(false);
    } catch (error: unknown) {
      const normalized = normalizeError(error);
      showToast({
        message: normalized.status === 404 ? "This admin no longer exists" : normalized.message,
        variant: "error",
      });
      if (normalized.status === 404) onMissing?.();
    }
  };

  return (
    <>
      <Switch
        aria-label={`Approved: ${admin.name}`}
        checked={admin.is_approved}
        disabled={isPending}
        id={`admin-approval-${admin.id}`}
        label="Approval"
        onChange={(event) => {
          if (event.target.checked) void applyApproval(true);
          else setSuspendOpen(true);
        }}
      />
      <Dialog
        description={`Suspend ${admin.name}? They will be signed out immediately and can't sign in until you approve them again.`}
        onClose={() => setSuspendOpen(false)}
        open={suspendOpen}
        title="Suspend admin"
      >
        <div className="grid gap-5">
          <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-small text-text">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={18} />
            <p>Suspending revokes every active session for this admin.</p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={isPending} onClick={() => setSuspendOpen(false)} variant="secondary">Cancel</Button>
            <Button loading={isPending} onClick={() => void applyApproval(false)} variant="danger">Suspend admin</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
