import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import type { Question } from "@/features/questions/types";

interface QuestionDeleteDialogProps {
  errorMessage?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  question: Question | null;
}

export function QuestionDeleteDialog({
  errorMessage,
  isDeleting,
  onClose,
  onConfirm,
  question,
}: QuestionDeleteDialogProps) {
  if (!question) {
    return null;
  }

  return (
    <Dialog
      description="This action removes the question from your question bank."
      onClose={onClose}
      open
      title="Delete this question?"
    >
      <div className="grid gap-5">
        <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-3 text-small text-warning">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <p>This can't be undone. A question used by a quiz may be refused by the server.</p>
        </div>
        <p className="break-words text-small text-text-muted">{question.question_text}</p>
        {errorMessage ? (
          <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-small text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled={isDeleting} onClick={onClose} variant="secondary">
            Keep question
          </Button>
          <Button
            icon={<Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />}
            loading={isDeleting}
            onClick={onConfirm}
            variant="danger"
          >
            Delete question
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
