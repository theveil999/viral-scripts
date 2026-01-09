import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastContainer } from "@/components/ui";
import "./globals.css";

// Validate environment variables at startup (server-side only)
import "@/lib/config";

export const metadata: Metadata = {
  title: "Viral Scripts",
  description: "Viral script generation system for content creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
