import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
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
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl content-center gap-5 px-6 py-12">
      <Card className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Route placeholder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {location.pathname}
        </h1>
        <p className="mt-5 text-slate-700">
          Signed in as {user.name} ({user.role})
        </p>
        {recheckMessage ? (
          <p className="mt-4 text-sm text-slate-600" role="status">
            {recheckMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={isChecking}
            loading={isChecking}
            onClick={() => void onRecheck()}
            variant="secondary"
          >
            Re-check session
          </Button>
          <Button onClick={() => void logout()} variant="danger">
            Log out
          </Button>
        </div>
      </Card>
    </main>
  );
}
