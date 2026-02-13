// src/components/ui/Alert.tsx
import { Link } from "react-router";
import React, { JSX } from "react";

interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  showLink?: boolean;
  linkHref?: string;
  linkText?: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  showLink = false,
  linkHref = "#",
  linkText = "Learn more",
  onClose,
}) => {
  const variantClasses: Record<
    string,
    { container: string; icon: string; titleText: string; messageText: string }
  > = {
    success: {
      container:
        "border border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/8",
      icon: "text-success-600",
      titleText: "text-success-800",
      messageText: "text-success-700",
    },
    error: {
      container:
        "border border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/8",
      icon: "text-error-600",
      titleText: "text-error-800",
      messageText: "text-error-700",
    },
    warning: {
      container:
        "border border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/8",
      icon: "text-warning-600",
      titleText: "text-warning-800",
      messageText: "text-warning-700",
    },
    info: {
      container:
        "border border-blue-100 bg-blue-50 dark:border-blue-300/30 dark:bg-blue-500/8",
      icon: "text-blue-600",
      titleText: "text-blue-800",
      messageText: "text-blue-700",
    },
  };

  const icons: Record<string, JSX.Element> = {
    success: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 12.5L11.5 15L15 10"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 7v6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 8v4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 17h.01"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.29 3.86L2.16 18a2 2 0 001.71 3h16.26a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 7h.01"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 11h2v5h-2z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  };

  return (
    <div
      className={`max-w-xs w-full rounded-lg p-3 shadow-lg flex items-start gap-3 ${variantClasses[variant].container}`}
      role="alert"
    >
      <div className={`${variantClasses[variant].icon}`}>{icons[variant]}</div>
      <div className="flex-1">
        {title && <div className={`text-sm font-semibold ${variantClasses[variant].titleText}`}>{title}</div>}
        <div className={`text-xs mt-1 ${variantClasses[variant].messageText}`}>{message}</div>
        {showLink && (
          <Link to={linkHref} className="text-xs mt-2 inline-block underline">
            {linkText}
          </Link>
        )}
      </div>

      <div className="ml-2">
        <button onClick={onClose} aria-label="close" className="text-sm opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
};

export default Alert;
