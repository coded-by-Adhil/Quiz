import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { normalizeError } from "@/lib/normalizeError";
import { useAuth } from "@/features/auth/useAuth";

export function AuthenticatedPlaceholderPage() {
  const { logout, recheckSession, user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState<string | undefined>();

  if (!user) {
    return null;
  }

  const onRecheck = async () => {
    setIsChecking(true);
    setRecheckMessage(undefined);

    try {
      await recheckSession();
      setRecheckMessage("Session is valid.");
    } catch (error: unknown) {
      setRecheckMessage(normalizeError(error).message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="grid gap-8">
      <PageHeader
        description="The visual foundation is ready for the next feature phase."
        eyebrow="Workspace route"
        title={location.pathname}
      />
      <Card className="max-w-2xl shadow-raised">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">Authenticated</Badge>
          <span className="font-mono text-label uppercase tracking-[0.1em] text-text-muted">
            {user.role}
          </span>
        </div>
        <p className="mt-5 text-body text-text">
          Signed in as <strong>{user.name}</strong>
        </p>
        <p className="mt-2 text-small text-text-muted">
          This placeholder preserves the F1 session controls while feature screens are added later.
        </p>
        {recheckMessage ? (
          <p className="mt-4 text-small text-text-muted" role="status">
            {recheckMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={isChecking}
            icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isChecking}
            onClick={() => void onRecheck()}
            variant="secondary"
          >
            Re-check session
          </Button>
          <Button
            icon={<LogOut aria-hidden="true" size={17} strokeWidth={1.8} />}
            onClick={() => void logout()}
            variant="danger"
          >
            Log out
          </Button>
        </div>
      </Card>
    </section>
  );
}
