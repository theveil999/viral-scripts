"use client";

import { motion } from "framer-motion";

type BadgeVariant =
  | "default"
  | "purple"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "pink"
  | "orange"
  | "cyan"
  | "success"
  | "danger";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  red: "bg-red-500/20 text-red-300 border-red-500/30",
  pink: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  danger: "bg-red-500/20 text-red-300 border-red-500/30",
};

const selectedStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-700 text-zinc-100 border-zinc-600",
  purple: "bg-purple-500/40 text-purple-100 border-purple-400/50",
  blue: "bg-blue-500/40 text-blue-100 border-blue-400/50",
  green: "bg-emerald-500/40 text-emerald-100 border-emerald-400/50",
  yellow: "bg-yellow-500/40 text-yellow-100 border-yellow-400/50",
  red: "bg-red-500/40 text-red-100 border-red-400/50",
  pink: "bg-pink-500/40 text-pink-100 border-pink-400/50",
  orange: "bg-orange-500/40 text-orange-100 border-orange-400/50",
  cyan: "bg-cyan-500/40 text-cyan-100 border-cyan-400/50",
  success: "bg-emerald-500/40 text-emerald-100 border-emerald-400/50",
  danger: "bg-red-500/40 text-red-100 border-red-400/50",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

// Map archetypes to colors
export const archetypeColors: Record<string, BadgeVariant> = {
  girl_next_door: "pink",
  bratty_princess: "purple",
  gym_baddie: "orange",
  alt_egirl: "cyan",
  classy_mysterious: "blue",
  party_girl: "yellow",
  nerdy_gamer_girl: "green",
  spicy_latina: "red",
  southern_belle: "orange",
  cool_girl: "blue",
  chaotic_unhinged: "red",
  soft_sensual: "pink",
  dominant: "purple",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  interactive = false,
  selected = false,
  onClick,
}: BadgeProps) {
  const Component = interactive ? motion.button : "span";
  const motionProps = interactive
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center font-medium rounded-full border
        transition-colors duration-200
        ${selected ? selectedStyles[variant] : variantStyles[variant]}
        ${sizes[size]}
        ${interactive ? "cursor-pointer" : ""}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

// Convenience component for archetype badges
export function ArchetypeBadge({
  archetype,
  size = "md",
  ...props
}: Omit<BadgeProps, "variant" | "children"> & { archetype: string }) {
  const color = archetypeColors[archetype] || "default";
  const displayName = archetype.replace(/_/g, " ");

  return (
    <Badge variant={color} size={size} {...props}>
      {displayName}
    </Badge>
  );
}
