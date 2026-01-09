"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  href?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  hover = false,
  href,
  onClick,
}: CardProps) {
  const baseStyles = `
    bg-zinc-900/50 border border-zinc-800 rounded-xl
    backdrop-blur-sm
    ${hover ? "hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-300" : ""}
    ${className}
  `;

  if (href) {
    return (
      <Link href={href}>
        <motion.div
          whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
          className={baseStyles}
        >
          {children}
        </motion.div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <motion.div
        whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
        onClick={onClick}
        className={`${baseStyles} cursor-pointer`}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseStyles}>{children}</div>;
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 border-b border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 border-t border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}
