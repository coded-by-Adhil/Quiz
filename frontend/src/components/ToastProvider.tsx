import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  ToastContext,
  type ToastOptions,
  type ToastVariant,
} from "@/components/toastContext";

interface Toast extends Required<ToastOptions> {
  id: number;
}

const variantClasses: Record<ToastVariant, string> = {
  info: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }, []);

  const showToast = useCallback(
    ({ message, variant = "info" }: ToastOptions) => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((currentToasts) => [
        ...currentToasts,
        { id, message, variant },
      ]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  const contextValue = useMemo(
    () => ({ dismissToast, showToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-label="Notifications"
        className="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2"
        role="region"
      >
        {toasts.map((toast) => (
          <div
            className={[
              "flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg",
              variantClasses[toast.variant],
            ].join(" ")}
            key={toast.id}
            role="status"
          >
            <span>{toast.message}</span>
            <button
              aria-label="Dismiss notification"
              className="font-semibold opacity-70 hover:opacity-100"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
