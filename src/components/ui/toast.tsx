"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

let toastId = 0;
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function showToast(message: string, type: ToastType = "info") {
  const id = `toast-${++toastId}`;
  toasts = [...toasts, { id, message, type }];
  notifyListeners();

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 4000);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const icons = {
    success: Check,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
    error: "bg-red-500/20 border-red-500/30 text-red-400",
    info: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {currentToasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm
                shadow-lg min-w-[280px] max-w-[400px]
                ${colors[toast.type]}
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
