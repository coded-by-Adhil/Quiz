import { useContext } from "react";
import { AuthContext } from "@/features/auth/context";
import type { AuthContextValue } from "@/features/auth/context";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
