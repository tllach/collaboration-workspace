import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth/context";
import { DocumentRole } from "@/lib/auth/document-role";
import { QueryProvider } from "@/lib/query/provider";
import { RoleSwitcher } from "@/components/workspace/RoleSwitcher"

import "./globals.css";

export const metadata: Metadata = {
  title: "Playground - Grayola Collaboration Workspace",
  description:
    "Single-page collaboration environment — a playground — where a Brand and a Designer work together on an active design request. One URL. One experience. But a role toggle that makes everything change. When you switch roles, the interface should shift meaningfully — not just cosmetically. What you see, what you can do, what the AI helps you with, how data is presented — all of it should reflect who you are in this collaboration. Under the hood, the separation must be real: both roles are actual authenticated users with properly enforced access boundaries.",
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
