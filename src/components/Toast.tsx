"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

type ToastType = "success" | "error";

type ToastData = {
  message: string;
  type: ToastType;
  id: number;
};

const TOAST_DURATION = 3500;

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
      }, TOAST_DURATION);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm">
      {toasts.map((toast) => {
        const exiting = exitingIds.has(toast.id);
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl ${
              exiting ? "animate-toast-exit" : "animate-toast-enter"
            } ${
              isError
                ? "bg-red-950/80 border-red-800/30 text-red-200 shadow-red-950/30"
                : "bg-green-950/80 border-green-800/30 text-green-200 shadow-green-950/30"
            }`}
            style={{
              boxShadow: isError
                ? "0 0 20px rgba(239, 68, 68, 0.08), 0 8px 32px rgba(0,0,0,0.4)"
                : "0 0 20px rgba(34, 197, 94, 0.08), 0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Icon */}
            {isError ? (
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-red-400" />
            ) : (
              <CheckCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-green-400" />
            )}

            {/* Message */}
            <p className="text-sm flex-1 leading-relaxed">{toast.message}</p>

            {/* Dismiss */}
            <button
              onClick={() => {
                setExitingIds((prev) => new Set(prev).add(toast.id));
                setTimeout(() => {
                  setToasts((prev) =>
                    prev.filter((t) => t.id !== toast.id)
                  );
                }, 250);
              }}
              className="shrink-0 text-white/30 hover:text-white/70 transition-colors p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress bar */}
            {!exiting && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]">
                <div
                  className={`h-full rounded-full ${
                    isError ? "bg-red-400/50" : "bg-green-400/50"
                  }`}
                  style={{
                    animation: `progress-drain ${TOAST_DURATION}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
