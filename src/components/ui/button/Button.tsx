import React, { ReactNode } from "react";

/**
 * ButtonProps:
 * - extends native button attributes so `type`, `disabled`, `onClick`, `aria-*`, etc are allowed
 * - adds custom props: size, variant, startIcon, endIcon
 */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = "md",
      variant = "primary",
      startIcon,
      endIcon,
      className = "",
      // rest contains native button props like type, disabled, onClick, aria-*, etc.
      ...rest
    },
    ref
  ) => {
    const sizeClasses: Record<string, string> = {
      sm: "px-4 py-3 text-sm",
      md: "px-5 py-3.5 text-sm",
    };

    const variantClasses: Record<string, string> = {
      primary:
        "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
      outline:
        "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    };

    // If caller passed className via rest (as ButtonHTMLAttributes includes it),
    // our destructured className will already hold it. (We defaulted className to "")
    const combinedClassName = `inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${sizeClasses[size]} ${variantClasses[variant]}`;

    return (
      <button
        ref={ref}
        className={`${combinedClassName} ${rest.disabled ? "cursor-not-allowed opacity-50" : ""}`}
        {...rest}
      >
        {startIcon && <span className="flex items-center">{startIcon}</span>}
        {children}
        {endIcon && <span className="flex items-center">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
