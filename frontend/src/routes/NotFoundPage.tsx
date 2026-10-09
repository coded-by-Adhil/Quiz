import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12 text-center">
      <div className="grid max-w-lg gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          404
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">
          Page not found
        </h1>
        <Link
          className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950"
          to="/status"
        >
          Open status page
        </Link>
      </div>
    </main>
  );
}
