import { useMemo, useState } from "react";
import {
  CircleHelp,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/Table";
import { useToast } from "@/components/useToast";
import { normalizeError } from "@/lib/normalizeError";
import {
  useDeleteQuestionMutation,
  useQuestionsQuery,
} from "@/features/questions/hooks/useQuestionQueries";
import { QuestionDeleteDialog } from "@/features/questions/components/QuestionDeleteDialog";
import { QuestionViewDialog } from "@/features/questions/components/QuestionViewDialog";
import type { Question } from "@/features/questions/types";

const questionsPerPage = 15;

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function QuestionTypeBadge({ type }: { type: Question["type"] }) {
  return (
    <Badge icon={<CircleHelp aria-hidden="true" size={14} />} variant={type === "single" ? "info" : "neutral"}>
      {type === "single" ? "Single" : "Multiple"}
    </Badge>
  );
}

function QuestionActions({
  displayNumber,
  onDelete,
  onView,
  question,
}: {
  displayNumber: number;
  onDelete: (question: Question) => void;
  onView: (question: Question) => void;
  question: Question;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        aria-label={`View question ${displayNumber}`}
        icon={<Eye aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={() => onView(question)}
        title="View question"
        variant="ghost"
      />
      <Link
        aria-label={`Edit question ${displayNumber}`}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-muted transition-colors duration-fast ease-standard hover:bg-surface-raised hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
        title="Edit question"
        to={`/admin/questions/${question.id}/edit`}
      >
        <Pencil aria-hidden="true" size={17} strokeWidth={1.8} />
      </Link>
      <Button
        aria-label={`Delete question ${displayNumber}`}
        icon={<Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={() => onDelete(question)}
        title="Delete question"
        variant="danger"
      />
    </div>
  );
}

function LoadingQuestions() {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading questions">
      {Array.from({ length: 5 }, (_, index) => (
        <Card className="grid gap-3" key={index}>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
        </Card>
      ))}
    </div>
  );
}

export function QuestionListPage() {
  const { data, error, isError, isLoading, refetch } = useQuestionsQuery();
  const deleteMutation = useDeleteQuestionMutation();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  const sortedQuestions = useMemo(
    () =>
      [...(data ?? [])].sort(
        (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
      ),
    [data],
  );
  const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / questionsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageQuestions = sortedQuestions.slice(
    (safePage - 1) * questionsPerPage,
    safePage * questionsPerPage,
  );

  const openDeleteDialog = (question: Question) => {
    deleteMutation.reset();
    setDeleteError(undefined);
    setDeleteQuestion(question);
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteQuestion(null);
    setDeleteError(undefined);
    deleteMutation.reset();
  };

  const confirmDelete = async () => {
    if (!deleteQuestion) {
      return;
    }

    setDeleteError(undefined);

    try {
      const response = await deleteMutation.mutateAsync(deleteQuestion.id);
      setDeleteQuestion(null);
      showToast({
        message: response.message || "Question deleted.",
        variant: "success",
      });
    } catch (mutationError: unknown) {
      setDeleteError(normalizeError(mutationError).message);
    }
  };

  return (
    <section className="grid gap-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            to="/admin/questions/new"
          >
            <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
            New question
          </Link>
        }
        description="Keep reusable questions and answer options ready for your quizzes."
        eyebrow="Question bank"
        title="Questions"
      />

      {isLoading ? <LoadingQuestions /> : null}

      {isError ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-heading font-semibold text-text">Questions could not load</h2>
            <p className="mt-2 text-small text-danger">{normalizeError(error).message}</p>
          </div>
          <div>
            <Button
              icon={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.8} />}
              onClick={() => void refetch()}
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {!isLoading && !isError && sortedQuestions.length === 0 ? (
        <EmptyState
          action={
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-small font-semibold text-primary-contrast transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-fast ease-standard hover:bg-primary/90 active:translate-y-px active:bg-primary/80 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              to="/admin/questions/new"
            >
              <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
              Create your first question
            </Link>
          }
          description="Start your question bank with a reusable question and its answer options."
          icon={<CircleHelp aria-hidden="true" size={26} strokeWidth={1.7} />}
          title="No questions yet"
        />
      ) : null}

      {!isLoading && !isError && sortedQuestions.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-subtle md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="w-[32%]">Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageQuestions.map((question, index) => {
                  const displayNumber = (safePage - 1) * questionsPerPage + index + 1;

                  return (
                    <TableRow key={question.id}>
                      <TableCell className="font-mono text-label text-text-muted">
                        {displayNumber}
                      </TableCell>
                      <TableCell>
                        <p
                          className="line-clamp-2 break-words font-semibold text-text"
                          title={question.question_text}
                        >
                          {question.question_text}
                        </p>
                      </TableCell>
                      <TableCell>
                        <QuestionTypeBadge type={question.type} />
                      </TableCell>
                      <TableCell className="text-label text-text-muted">
                        {formatDate(question.created_at)}
                      </TableCell>
                      <TableCell className="text-label text-text-muted">
                        {formatDate(question.updated_at)}
                      </TableCell>
                      <TableCell>
                        <QuestionActions
                          displayNumber={displayNumber}
                          onDelete={openDeleteDialog}
                          onView={setViewQuestion}
                          question={question}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {pageQuestions.map((question, index) => {
              const displayNumber = (safePage - 1) * questionsPerPage + index + 1;

              return (
                <Card className="grid gap-4" key={question.id}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-label text-text-muted">
                      Question #{displayNumber}
                    </span>
                    <QuestionTypeBadge type={question.type} />
                  </div>
                  <p
                    className="break-words font-semibold text-text"
                    title={question.question_text}
                  >
                    {question.question_text}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 text-label text-text-muted">
                    <div>
                      <dt>Created</dt>
                      <dd className="mt-1 text-text">{formatDate(question.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd className="mt-1 text-text">{formatDate(question.updated_at)}</dd>
                    </div>
                  </dl>
                  <QuestionActions
                    displayNumber={displayNumber}
                    onDelete={openDeleteDialog}
                    onView={setViewQuestion}
                    question={question}
                  />
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={safePage}
            onPageChange={(page) => setCurrentPage(Math.min(page, totalPages))}
            totalPages={totalPages}
          />
        </>
      ) : null}

      <QuestionViewDialog onClose={() => setViewQuestion(null)} question={viewQuestion} />
      <QuestionDeleteDialog
        errorMessage={deleteError}
        isDeleting={deleteMutation.isPending}
        onClose={closeDeleteDialog}
        onConfirm={() => void confirmDelete()}
        question={deleteQuestion}
      />
    </section>
  );
}
