import { CircleHelp } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Dialog } from "@/components/Dialog";
import type { QuizLink } from "@/features/links/types";

interface QuizLinkQuestionsDialogProps {
  link: QuizLink | null;
  onClose: () => void;
}

export function QuizLinkQuestionsDialog({
  link,
  onClose,
}: QuizLinkQuestionsDialogProps) {
  if (!link) {
    return null;
  }

  const questions = [...link.questions].sort(
    (left, right) => left.pivot.order - right.pivot.order,
  );

  return (
    <Dialog
      description="The questions included in this shareable link, in guest order."
      onClose={onClose}
      open
      title="Link questions"
    >
      <div className="max-h-[min(60vh,34rem)] overflow-y-auto pr-1">
        <ol className="grid gap-2" aria-label="Questions in this link">
          {questions.map((question, index) => (
            <li
              className="grid gap-2 rounded-md border border-border bg-surface-raised/40 px-3 py-3"
              key={question.id}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-label font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 break-words text-small font-semibold text-text">
                  {question.question_text}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-7">
                <Badge
                  icon={<CircleHelp aria-hidden="true" size={13} />}
                  variant={question.type === "single" ? "info" : "neutral"}
                >
                  {question.type === "single" ? "Single" : "Multiple"}
                </Badge>
                <span className="text-label text-text-muted">{question.marks} marks</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Dialog>
  );
}
