"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  label: string;
  description?: string;
}

interface ProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Progress({ steps, currentStep, className = "" }: ProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? "rgb(139, 92, 246)"
                      : isCurrent
                      ? "rgb(139, 92, 246)"
                      : "rgb(39, 39, 42)",
                  }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-colors duration-300
                    ${isCompleted || isCurrent ? "border-purple-500" : "border-zinc-700"}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-medium ${
                        isCurrent ? "text-white" : "text-zinc-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                </motion.div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? "text-zinc-100" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-zinc-800 relative">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple horizontal progress bar
export function ProgressBar({
  value,
  max = 100,
  className = "",
  showLabel = false,
}: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
        />
      </div>
      {showLabel && (
        <p className="text-xs text-zinc-500 mt-1 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}
