import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth/context";
import { DocumentRole } from "@/lib/auth/document-role";
import { QueryProvider } from "@/lib/query/provider";
import { RoleSwitcher } from "@/components/workspace/RoleSwitcher"

import "./globals.css";

export const metadata: Metadata = {
  title: "Briefed — Design Collaboration",
  description:
    "Briefed is a design collaboration platform that connects brands and designers in one shared workspace.",
  openGraph: {
    title: "Briefed — Design Collaboration",
    description:
      "Briefed is a design collaboration platform that connects brands and designers in one shared workspace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <QueryProvider>
            <DocumentRole />
            <header>
              <RoleSwitcher />
            </header>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
