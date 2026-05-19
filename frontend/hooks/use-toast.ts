/**
 * Toast Hook — powered by sonner
 *
 * Wraps sonner's toast API with the same interface used across the dashboard
 * so existing code (useToast / toast({ title, description, variant })) keeps
 * working without any changes.
 */

"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastOptions) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        duration: 4000,
      });
    } else {
      sonnerToast.success(title, {
        description,
        duration: 3000,
      });
    }
  };

  return { toast };
}
