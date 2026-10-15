import { Copy } from "lucide-react";
import { Button } from "@/components/Button";
import { Tooltip } from "@/components/Tooltip";

interface CopyButtonProps {
  label?: string;
  onCopy: () => void;
}

export function CopyButton({ label = "Copy link", onCopy }: CopyButtonProps) {
  return (
    <Tooltip label={label}>
      <Button
        aria-label={label}
        icon={<Copy aria-hidden="true" size={17} strokeWidth={1.8} />}
        onClick={onCopy}
        title={label}
        variant="ghost"
      />
    </Tooltip>
  );
}
