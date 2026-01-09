"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileText, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/models", label: "Creators", icon: Users },
  { href: "/scripts", label: "Scripts", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-zinc-100">Viral Scripts</h1>
            <p className="text-xs text-zinc-500">Creator Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <Link href="/settings">
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </motion.div>
        </Link>
      </div>
    </aside>
  );
}
