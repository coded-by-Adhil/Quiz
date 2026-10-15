import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleOff,
  ExternalLink,
  Link2,
  Plus,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { Skeleton } from "@/components/Skeleton";
import { Switch } from "@/components/Switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/Table";
import { Tooltip } from "@/components/Tooltip";
import { useToast } from "@/components/useToast";
import { useQuizQuery } from "@/features/quizzes/hooks/useQuizQueries";
import { useAllQuizzes } from "@/features/quizzes/hooks/useAllQuizzes";
import { CreateLinkDialog } from "@/features/links/components/CreateLinkDialog";
import { CopyLinkDialog } from "@/features/links/components/CopyLinkDialog";
import { QuizLinkQuestionsDialog } from "@/features/links/components/QuizLinkQuestionsDialog";
import {
  useQuizLinksQuery,
  useSetLinkActiveMutation,
} from "@/features/links/hooks/useLinkQueries";
import { useLinkUrlState } from "@/features/links/hooks/useLinkUrlState";
import type { QuizLink } from "@/features/links/types";
import { buildGuestUrl } from "@/lib/buildGuestUrl";
import { normalizeError } from "@/lib/normalizeError";

const inactiveHelperText = "While inactive, guests can't start this quiz from the link.";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function linkUrl(link: QuizLink): string {
  return buildGuestUrl(link.token);
}

function LinkStatus({
  link,
  onToggle,
  pending,
}: {
  link: QuizLink;
  onToggle: (link: QuizLink, isActive: boolean) => void;
  pending: boolean;
}) {
  const statusLabel = link.is_active ? "Active" : "Inactive";

  return (
    <div className="grid min-w-44 gap-2">
      <div className="flex items-center gap-2">
        {link.is_active ? (
          <CheckCircle2 aria-hidden="true" className="text-success" size={16} />
        ) : (
          <CircleOff aria-hidden="true" className="text-warning" size={16} />
        )}
        <span className="text-small font-semibold text-text">{statusLabel}</span>
      </div>
      <Switch
        checked={link.is_active}
        description={inactiveHelperText}
        disabled={pending}
        id={`link-active-${link.id}`}
        label={statusLabel}
        onChange={(event) => onToggle(link, event.target.checked)}
      />
    </div>
  );
}

function LinkActions({
  link,
  onCopy,
  onView,
}: {
  link: QuizLink;
  onCopy: (link: QuizLink) => void;
  onView: (link: QuizLink) => void;
}) {
  const url = linkUrl(link);

  return (
    <div className="flex items-center justify-end gap-1">
      <CopyButton onCopy={() => onCopy(link)} />
      <Tooltip label="View questions">
        <Button
          aria-label="View questions in link"
          icon={<Eye aria-hidden="true" size={17} strokeWidth={1.8} />}
          onClick={() => onView(link)}
          title="View questions"
          variant="ghost"
        />
      </Tooltip>
      <Tooltip label="Open link">
        <a
          aria-label="Open guest link in a new tab"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
          href={url}
          rel="noopener noreferrer"
          target="_blank"
          title="Open link"
        >
          <ExternalLink aria-hidden="true" size={17} strokeWidth={1.8} />
        </a>
      </Tooltip>
    </div>
  );
}

function LoadingLinks() {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading links">
      {Array.from({ length: 4 }, (_, index) => (
        <Card className="grid gap-3" key={index}>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-1/2" />
        </Card>
      ))}
    </div>
  );
}

export function LinkManagementPage() {
  const { hasInvalidQuizParam, selectedQuizId, setSelectedQuizId } = useLinkUrlState();
  const allQuizzesQuery = useAllQuizzes();
  const selectedQuizQuery = useQuizQuery(selectedQuizId);
  const linksQuery = useQuizLinksQuery(selectedQuizId);
  const activeMutation = useSetLinkActiveMutation();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewLink, setViewLink] = useState<QuizLink | null>(null);
  const [copyUrl, setCopyUrl] = useState<string | null>(null);
  const [copyAnnouncement, setCopyAnnouncement] = useState("");

  const selectedQuizError = selectedQuizQuery.error ? normalizeError(selectedQuizQuery.error) : undefined;
  const linksError = linksQuery.error ? normalizeError(linksQuery.error) : undefined;
  const notFound = Boolean(
    hasInvalidQuizParam ||
      (selectedQuizId !== null &&
        (selectedQuizError?.status === 403 ||
          selectedQuizError?.status === 404 ||
          linksError?.status === 403 ||
          linksError?.status === 404)),
  );

  useEffect(() => {
    if (notFound) {
      setSelectedQuizId(null);
    }
  }, [notFound, setSelectedQuizId]);

  const sortedLinks = useMemo(
    () =>
      [...(linksQuery.data ?? [])].sort(
        (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
      ),
    [linksQuery.data],
  );

  const handleToggle = async (link: QuizLink, isActive: boolean) => {
    if (selectedQuizId === null) {
      return;
    }

    try {
      await activeMutation.mutateAsync({
        is_active: isActive,
        linkId: link.id,
        quizId: selectedQuizId,
      });
    } catch (error: unknown) {
      showToast({ message: normalizeError(error).message, variant: "error" });
    }
  };

  const copyLink = async (link: QuizLink) => {
    const url = linkUrl(link);
    const clipboard = navigator.clipboard;

    if (!clipboard) {
      setCopyUrl(url);
      showToast({ message: "Select the link to copy it.", variant: "info" });
      return;
    }

    try {
      await clipboard.writeText(url);
      setCopyAnnouncement("Link copied");
      showToast({ message: "Link copied", variant: "success" });
      window.setTimeout(() => setCopyAnnouncement(""), 3000);
    } catch {
      setCopyUrl(url);
      showToast({ message: "Select the link to copy it.", variant: "info" });
    }
  };

  const linksErrorMessage = linksError?.message ?? "The links could not be loaded.";
  const isSelectedQuizLoading = selectedQuizId !== null && selectedQuizQuery.isLoading;
  const showLinksArea = selectedQuizId !== null && !notFound;

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <Button
            disabled={selectedQuizId === null}
            icon={<Plus aria-hidden="true" size={17} strokeWidth={1.8} />}
            onClick={() => setCreateOpen(true)}
          >
            New link
          </Button>
        }
        description="Create focused shareable links, choose their question subset, and control guest access."
        eyebrow="Quiz links"
        title="Shareable links"
      />

      <div className="grid gap-3 border-b border-border pb-5 md:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] md:items-end">
        <Select
          disabled={allQuizzesQuery.isLoading || allQuizzesQuery.isError}
          id="links-quiz-select"
          label="Choose a quiz"
          onChange={(event) => {
            const value = event.target.value;
            setSelectedQuizId(value ? Number(value) : null);
          }}
          value={selectedQuizId ?? ""}
        >
          <option value="">Choose a quiz</option>
          {(allQuizzesQuery.data?.quizzes ?? []).map((quiz) => (
            <option key={quiz.id} value={quiz.id}>
              {quiz.title}
            </option>
          ))}
        </Select>
        {allQuizzesQuery.data?.capHit ? (
          <p className="text-small text-warning">
            Showing the first {allQuizzesQuery.data.quizzes.length} quizzes.
          </p>
        ) : null}
      </div>

      {allQuizzesQuery.isError ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Quizzes could not load</h2>
            <p className="mt-2 text-small text-danger">{normalizeError(allQuizzesQuery.error).message}</p>
          </div>
          <Button icon={<RefreshCw aria-hidden="true" size={17} />} onClick={() => void allQuizzesQuery.refetch()} variant="secondary">
            Retry
          </Button>
        </Card>
      ) : null}

      {!allQuizzesQuery.isLoading && !allQuizzesQuery.isError && allQuizzesQuery.data?.quizzes.length === 0 ? (
        <EmptyState
          action={<Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast focus-visible:ring-2 focus-visible:ring-focus-ring" to="/admin/quizzes/new"><Plus aria-hidden="true" size={17} />Create a quiz</Link>}
          description="Create a quiz before generating a link for guests."
          icon={<Link2 aria-hidden="true" size={26} />}
          title="You have no quizzes yet"
        />
      ) : null}

      {notFound ? (
        <EmptyState
          action={<Button onClick={() => setSelectedQuizId(null)} variant="secondary">Choose another quiz</Button>}
          description="This quiz does not exist or does not belong to your account."
          icon={<Link2 aria-hidden="true" size={26} />}
          title="Quiz not found"
        />
      ) : null}

      {!notFound && selectedQuizId === null && !allQuizzesQuery.isLoading && allQuizzesQuery.data?.quizzes.length ? (
        <EmptyState
          description="Select one of your quizzes above to see its shareable links."
          icon={<Link2 aria-hidden="true" size={26} />}
          title="Choose a quiz to see its links"
        />
      ) : null}

      {showLinksArea && selectedQuizQuery.isError && !notFound ? (
        <Card className="grid gap-4">
          <div><h2 className="text-heading font-semibold text-text">Quiz could not load</h2><p className="mt-2 text-small text-danger">{selectedQuizError?.message ?? "The quiz could not be loaded."}</p></div>
          <Button icon={<RefreshCw aria-hidden="true" size={16} />} onClick={() => void selectedQuizQuery.refetch()} variant="secondary">Retry</Button>
        </Card>
      ) : null}

      {showLinksArea && isSelectedQuizLoading ? <LoadingLinks /> : null}

      {showLinksArea && !isSelectedQuizLoading && !selectedQuizQuery.isError && linksQuery.isLoading ? <LoadingLinks /> : null}

      {showLinksArea && !isSelectedQuizLoading && !linksQuery.isLoading && linksQuery.isError && !notFound ? (
        <Card className="grid gap-4">
          <div><h2 className="text-heading font-semibold text-text">Links could not load</h2><p className="mt-2 text-small text-danger">{linksErrorMessage}</p></div>
          <Button icon={<RefreshCw aria-hidden="true" size={16} />} onClick={() => void linksQuery.refetch()} variant="secondary">Retry</Button>
        </Card>
      ) : null}

      {showLinksArea && !isSelectedQuizLoading && !selectedQuizQuery.isError && !linksQuery.isLoading && !linksQuery.isError && sortedLinks.length === 0 ? (
        <EmptyState
          action={<Button icon={<Plus aria-hidden="true" size={17} />} onClick={() => setCreateOpen(true)}>Create a link</Button>}
          description="Choose a question subset to create the first shareable link for this quiz."
          icon={<Link2 aria-hidden="true" size={26} />}
          title="No links yet. Create one to share this quiz."
        />
      ) : null}

      {showLinksArea && !isSelectedQuizLoading && !selectedQuizQuery.isError && !linksQuery.isLoading && !linksQuery.isError && sortedLinks.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLinks.map((link) => {
                  const url = linkUrl(link);
                  return (
                    <TableRow key={link.id}>
                      <TableCell>
                        <span className="block max-w-[18rem] truncate whitespace-nowrap font-mono text-label text-text" title={url}>{url}</span>
                      </TableCell>
                      <TableCell className="text-small text-text-muted">{link.questions.length}</TableCell>
                      <TableCell className="text-label text-text-muted">{formatDate(link.created_at)}</TableCell>
                      <TableCell><LinkStatus link={link} onToggle={handleToggle} pending={activeMutation.isPending && activeMutation.variables?.linkId === link.id} /></TableCell>
                      <TableCell><LinkActions link={link} onCopy={copyLink} onView={setViewLink} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {sortedLinks.map((link) => {
              const url = linkUrl(link);
              return (
                <Card className="grid gap-4" key={link.id}>
                  <div className="grid gap-2">
                    <span className="block truncate whitespace-nowrap font-mono text-label text-text" title={url}>{url}</span>
                    <div className="flex flex-wrap gap-3 text-small text-text-muted"><span>{link.questions.length} questions</span><span>{formatDate(link.created_at)}</span></div>
                  </div>
                  <LinkStatus link={link} onToggle={handleToggle} pending={activeMutation.isPending && activeMutation.variables?.linkId === link.id} />
                  <LinkActions link={link} onCopy={copyLink} onView={setViewLink} />
                </Card>
              );
            })}
          </div>
        </>
      ) : null}

      <p aria-live="polite" className="sr-only">{copyAnnouncement}</p>
      <CreateLinkDialog
        defaultQuizId={selectedQuizId}
        onClose={() => setCreateOpen(false)}
        onCreated={(quizId) => setSelectedQuizId(quizId)}
        open={createOpen}
      />
      <QuizLinkQuestionsDialog link={viewLink} onClose={() => setViewLink(null)} />
      <CopyLinkDialog onClose={() => setCopyUrl(null)} url={copyUrl} />
    </section>
  );
}
