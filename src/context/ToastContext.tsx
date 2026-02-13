// src/context/ToastContext.tsx
import React, { createContext, useContext, useCallback, useState } from "react";
import Alert from "../components/ui/alert/Alert";
import { v4 as uuidv4 } from "uuid";

type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = {
    id: string;
    variant: ToastVariant;
    title?: string;
    message: string;
    duration?: number; // ms
};

type ToastContextType = {
    showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((t) => t.filter((x) => x.id !== id));
    }, []);

    const showToast = useCallback(({ variant, title, message, duration = 4000 }: Omit<Toast, "id">) => {
        const id = uuidv4();
        const newToast: Toast = { id, variant, title, message, duration };
        setToasts((t) => [newToast, ...t]);

        // auto remove
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container bottom-right */}
            <div className="fixed z-50 flex flex-col gap-3 p-4 bottom-6 right-6 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <Alert
                            variant={t.variant}
                            title={t.title || undefined}
                            message={t.message}
                            onClose={() => removeToast(t.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};
