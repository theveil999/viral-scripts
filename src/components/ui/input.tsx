"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-300">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-zinc-800/50 border border-zinc-700
            text-zinc-100 placeholder-zinc-500
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""}
            ${className}
          `}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-zinc-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
