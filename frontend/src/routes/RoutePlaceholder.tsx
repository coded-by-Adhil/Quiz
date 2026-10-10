import { useLocation } from "react-router-dom";
import { Badge } from "@/components/Badge";
import { PageHeader } from "@/components/PageHeader";

export function RoutePlaceholder() {
  const location = useLocation();

  return (
    <section className="grid gap-8">
      <PageHeader
        description="This public route is reserved for the guest quiz experience."
        eyebrow="Guest route"
        title={location.pathname}
      />
      <Badge variant="neutral">Feature screen coming later</Badge>
    </section>
  );
}
