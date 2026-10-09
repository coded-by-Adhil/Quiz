import { createContext } from "react";

export type ToastVariant = "info" | "success" | "error";

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
}

export interface ToastContextValue {
  dismissToast: (id: number) => void;
  showToast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
