"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

type ToastType = "success" | "error";

type ToastData = {
  message: string;
  type: ToastType;
  id: number;
};

let toastId = 0;
let pushToast: ((data: ToastData) => void) | null = null;

export function showToast(message: string, type: ToastType = "error") {
  pushToast?.({ message, type, id: ++toastId });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    pushToast = (data) => {
      setToasts((prev) => [...prev, data]);
      setTimeout(() => {
        setExitingIds((prev) => new Set(prev).add(data.id));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== data.id));
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(data.id);
            return next;
          });
        }, 250);
      }, 3500);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const exiting = exitingIds.has(toast.id);
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${
              exiting ? "animate-toast-exit" : "animate-toast-enter"
            } ${
              toast.type === "error"
                ? "bg-red-950/80 border-red-900/50 text-red-200"
                : "bg-green-950/80 border-green-900/50 text-green-200"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
            )}
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => {
                setExitingIds((prev) => new Set(prev).add(toast.id));
                setTimeout(() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }, 250);
              }}
              className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
