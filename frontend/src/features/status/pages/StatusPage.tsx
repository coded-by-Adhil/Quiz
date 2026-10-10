import { CheckCircle2, Database, RefreshCw, XCircle, Activity } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { normalizeError } from "@/lib/normalizeError";
import { useHealthQuery, usePingQuery } from "@/features/status/hooks/useStatusQueries";

interface StatusPanelProps<T extends object> {
  data: T | undefined;
  error: unknown;
  icon: typeof Activity;
  isLoading: boolean;
  onRetry: () => void;
  title: string;
}

function StatusPanel<T extends object>({
  data,
  error,
  icon: Icon,
  isLoading,
  onRetry,
  title,
}: StatusPanelProps<T>) {
  if (isLoading) {
    return (
      <Card aria-busy="true" className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-primary">
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <h2 className="text-heading font-semibold text-text">{title}</h2>
          </div>
          <Spinner size="sm" />
        </div>
        <div className="h-20 animate-pulse rounded-md bg-surface-raised" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-danger">
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <h2 className="text-heading font-semibold text-text">{title}</h2>
          </div>
          <Badge
            icon={<XCircle aria-hidden="true" size={14} strokeWidth={1.8} />}
            variant="danger"
          >
            Unavailable
          </Badge>
        </div>
        <p className="text-small text-danger" role="alert">
          {normalizeError(error).message}
        </p>
        <Button
          className="justify-self-start"
          icon={<RefreshCw aria-hidden="true" size={16} strokeWidth={1.8} />}
          onClick={onRetry}
          variant="secondary"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-primary">
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
          </span>
          <h2 className="text-heading font-semibold text-text">{title}</h2>
        </div>
        <Badge
          icon={<CheckCircle2 aria-hidden="true" size={14} strokeWidth={1.8} />}
          variant="success"
        >
          Operational
        </Badge>
      </div>
      <pre className="overflow-x-auto rounded-md border border-border bg-surface-raised p-4 text-left font-mono text-small text-text">
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
    <main className="min-h-screen bg-background px-5 py-10 text-text sm:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <PageHeader
          actions={
            <Button
              icon={<RefreshCw aria-hidden="true" size={16} strokeWidth={1.8} />}
              disabled={pingQuery.isFetching || healthQuery.isFetching}
              loading={pingQuery.isFetching || healthQuery.isFetching}
              onClick={retryAll}
              variant="secondary"
            >
              Retry all
            </Button>
          }
          description="A small operational view for confirming the Laravel API and database connection."
          eyebrow="Frontend foundation"
          title="System status"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <StatusPanel
            data={pingQuery.data}
            error={pingQuery.error}
            icon={Activity}
            isLoading={pingQuery.isPending || pingQuery.isFetching}
            onRetry={() => void pingQuery.refetch()}
            title="API ping"
          />
          <StatusPanel
            data={healthQuery.data}
            error={healthQuery.error}
            icon={Database}
            isLoading={healthQuery.isPending || healthQuery.isFetching}
            onRetry={() => void healthQuery.refetch()}
            title="Database health"
          />
        </div>
      </div>
    </main>
  );
}
