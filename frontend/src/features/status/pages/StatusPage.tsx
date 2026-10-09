import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { normalizeError } from "@/lib/normalizeError";
import { useHealthQuery, usePingQuery } from "@/features/status/hooks/useStatusQueries";

interface StatusPanelProps<T extends object> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  onRetry: () => void;
  title: string;
}

function StatusPanel<T extends object>({
  data,
  error,
  isLoading,
  onRetry,
  title,
}: StatusPanelProps<T>) {
  if (isLoading) {
    return (
      <Card aria-busy="true">
        <div className="flex items-center gap-3">
          <Spinner />
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600">Checking endpoint...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {normalizeError(error).message}
        </p>
        <Button className="mt-4" onClick={onRetry} variant="secondary">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <pre className="mt-3 overflow-x-auto rounded-md bg-slate-950 p-4 text-left text-sm text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}

export function StatusPage() {
  const pingQuery = usePingQuery();
  const healthQuery = useHealthQuery();
  const retryAll = () => {
    void pingQuery.refetch();
    void healthQuery.refetch();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto grid w-full max-w-4xl gap-8">
        <header className="grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Frontend foundation
          </p>
          <h1 className="text-3xl font-semibold">API status</h1>
          <p className="text-slate-600">
            Confirming connectivity with the Laravel API and database health
            endpoint.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <StatusPanel
            data={pingQuery.data}
            error={pingQuery.error}
            isLoading={pingQuery.isPending || pingQuery.isFetching}
            onRetry={() => void pingQuery.refetch()}
            title="API ping"
          />
          <StatusPanel
            data={healthQuery.data}
            error={healthQuery.error}
            isLoading={healthQuery.isPending || healthQuery.isFetching}
            onRetry={() => void healthQuery.refetch()}
            title="Database health"
          />
        </div>

        <Button
          className="justify-self-start"
          disabled={pingQuery.isFetching || healthQuery.isFetching}
          loading={pingQuery.isFetching || healthQuery.isFetching}
          onClick={retryAll}
          variant="secondary"
        >
          Retry all
        </Button>
      </div>
    </main>
  );
}
