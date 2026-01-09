"use client";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

// Generate a consistent gradient based on name
function getGradient(name: string): string {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-violet-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-amber-500 to-orange-500",
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div
      className={`
        ${sizes[size]}
        rounded-full flex items-center justify-center
        bg-gradient-to-br ${gradient}
        font-semibold text-white
        shadow-lg
        ${className}
      `}
    >
      {initials}
    </div>
  );
}
