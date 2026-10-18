"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.id === id ? null : curr));
    }, 3800);
  }, []);

  const dismiss = () => setNotification(null);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Floating Production-Grade Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {notification && (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white border border-cream-200/90 shadow-elevated"
              style={{
                borderLeftWidth: "4px",
                borderLeftColor:
                  notification.type === "success"
                    ? "#10b981"
                    : notification.type === "error"
                    ? "#ef4444"
                    : notification.type === "warning"
                    ? "#f59e0b"
                    : "#3b82f6",
              }}
            >
              <div className="shrink-0 mt-0.5">
                {notification.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {notification.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {notification.type === "warning" && (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                {notification.type === "info" && (
                  <Info className="w-5 h-5 text-blue-500" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-0.5">
                  {notification.type === "success"
                    ? "Success"
                    : notification.type === "error"
                    ? "Error"
                    : notification.type === "warning"
                    ? "Notice"
                    : "Info"}
                </p>
                <p className="text-sm font-medium text-navy-800 leading-snug">
                  {notification.message}
                </p>
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="shrink-0 text-navy-400 hover:text-navy-700 p-1 rounded-md hover:bg-cream-100 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}
