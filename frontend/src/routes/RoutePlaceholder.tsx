import { useLocation } from "react-router-dom";

export function RoutePlaceholder() {
  const location = useLocation();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl content-center gap-3 px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Route placeholder
      </p>
      <h1 className="text-3xl font-semibold text-slate-950">
        {location.pathname}
      </h1>
    </main>
  );
}
