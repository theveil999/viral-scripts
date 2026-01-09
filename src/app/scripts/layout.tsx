import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generated Scripts | Viral Scripts",
  description: "View and manage all generated scripts",
};

export default function ScriptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
