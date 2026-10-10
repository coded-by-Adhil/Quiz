import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Badge } from "@/components/Badge";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12 text-center text-text sm:px-8">
      <div className="grid max-w-lg gap-4">
        <div className="mx-auto text-primary">
          <FileQuestion aria-hidden="true" size={36} strokeWidth={1.5} />
        </div>
        <Badge variant="neutral">404 · Not found</Badge>
        <h1 className="text-title font-semibold">Page not found</h1>
        <Link
          className="mx-auto inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-small font-semibold text-primary underline underline-offset-4 transition-colors duration-fast ease-standard hover:text-text focus-visible:ring-2 focus-visible:ring-focus-ring"
          to="/status"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} />
          Open status page
        </Link>
      </div>
    </main>
  );
}
