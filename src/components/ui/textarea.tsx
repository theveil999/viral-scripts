"use client";

import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, showCount, maxLength, value, className = "", ...props }, ref) => {
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-1.5">
        {label && (
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-zinc-300">
              {label}
              {props.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {showCount && (
              <span className="text-xs text-zinc-500">
                {charCount.toLocaleString()}
                {maxLength && ` / ${maxLength.toLocaleString()}`} chars
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-zinc-800/50 border border-zinc-700
            text-zinc-100 placeholder-zinc-500
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none font-mono text-sm
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

Textarea.displayName = "Textarea";
