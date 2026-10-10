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
} from "@/components/toastContext";
import { Toast } from "@/components/Toast";

interface Toast extends Required<ToastOptions> {
  id: number;
}

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
          <Toast
            key={toast.id}
            message={toast.message}
            onDismiss={() => dismissToast(toast.id)}
            variant={toast.variant}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
