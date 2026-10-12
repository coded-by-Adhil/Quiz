import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Dialog } from "@/components/Dialog";
import type { Question } from "@/features/questions/types";

interface QuestionViewDialogProps {
  onClose: () => void;
  question: Question | null;
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function QuestionViewDialog({ onClose, question }: QuestionViewDialogProps) {
  if (!question) {
    return null;
  }

  return (
    <Dialog
      description="Read-only view of this question and its answer options."
      onClose={onClose}
      open
      title="Question details"
    >
      <div className="grid gap-5">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge icon={<CircleHelp aria-hidden="true" size={14} />} variant="info">
              {question.type === "single" ? "Single" : "Multiple"}
            </Badge>
            <Badge variant="neutral">{question.marks} marks</Badge>
          </div>
          <p className="whitespace-pre-wrap break-words text-body font-semibold text-text">
            {question.question_text}
          </p>
        </div>

        <dl className="grid gap-3 border-y border-border py-4 text-small sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-text-muted">Created</dt>
            <dd className="mt-1 text-text">{formatDate(question.created_at)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-muted">Updated</dt>
            <dd className="mt-1 text-text">{formatDate(question.updated_at)}</dd>
          </div>
        </dl>

        <div className="grid gap-3">
          <h3 className="text-small font-semibold text-text">Options</h3>
          <ol className="grid gap-2">
            {question.options.map((option) => (
              <li
                className="flex items-start gap-3 rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-small"
                key={option.id}
              >
                {option.is_correct ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-success" size={17} />
                ) : (
                  <XCircle aria-hidden="true" className="mt-0.5 shrink-0 text-text-muted" size={17} />
                )}
                <span className="min-w-0 break-words text-text">{option.option_text}</span>
                <span className="ml-auto shrink-0 font-semibold text-small text-text-muted">
                  {option.is_correct ? "Correct" : "Not correct"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Dialog>
  );
}
