import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import type { QuizListItem } from "@/features/quizzes/types";

interface QuizDeleteDialogProps {
  errorMessage?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quiz: QuizListItem | null;
}

export function QuizDeleteDialog({
  errorMessage,
  isDeleting,
  onClose,
  onConfirm,
  quiz,
}: QuizDeleteDialogProps) {
  if (!quiz) {
    return null;
  }

  return (
    <Dialog
      description="This removes the quiz from your workspace and disables its guest link."
      onClose={onClose}
      open
      title="Delete this quiz?"
    >
      <div className="grid gap-5">
        <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-small text-warning">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <p>This can't be undone. Participants will no longer be able to open its shared link.</p>
        </div>
        <p className="break-words text-small font-semibold text-text">{quiz.title}</p>
        {errorMessage ? (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled={isDeleting} onClick={onClose} variant="secondary">
            Keep quiz
          </Button>
          <Button
            icon={<Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isDeleting}
            onClick={onConfirm}
            variant="danger"
          >
            Delete quiz
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
