import { Input } from "@/components/Input";
import { Dialog } from "@/components/Dialog";

interface CopyLinkDialogProps {
  onClose: () => void;
  url: string | null;
}

export function CopyLinkDialog({ onClose, url }: CopyLinkDialogProps) {
  if (!url) {
    return null;
  }

  return (
    <Dialog
      description="Your browser did not provide clipboard access. Select the full link below to copy it manually."
      onClose={onClose}
      open
      title="Copy shareable link"
    >
      <div className="grid gap-4">
        <Input
          autoFocus
          id="copy-link-fallback"
          label="Shareable link"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={url}
        />
        <p className="text-small text-text-muted">
          The link is selectable and has not been placed in an admin-app URL.
        </p>
      </div>
    </Dialog>
  );
}
