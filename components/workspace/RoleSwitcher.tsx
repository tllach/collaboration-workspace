"use client";

import { useAuth } from "@/lib/auth/context";
import type { UserRole } from "@/types";

const ACCOUNTS = [
  {
    email: "brand1@grayola.io",
    password: "grayola123",
    display: "Sofia · Brand",
  },
  {
    email: "brand2@grayola.io",
    password: "grayola123",
    display: "Carlos · Brand",
  },
  {
    email: "designer@grayola.io",
    password: "grayola123",
    display: "Alex · Designer",
  },
] as const;

function Spinner() {
  return (
    <span
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function roleBadgeClass(role: UserRole | null): string {
  if (role === "brand") return "bg-[#7F77DD]/15 text-[#5a52b8] ring-1 ring-[#7F77DD]/30";
  if (role === "designer")
    return "bg-[#1D9E75]/15 text-[#157a5a] ring-1 ring-[#1D9E75]/30";
  return "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200";
}

export function RoleSwitcher() {
  const { profile, isLoading, signInAs } = useAuth();

  const displayName = profile?.full_name?.trim() || profile?.email || "—";
  
  const roleLabel =
    profile?.role === "brand"
      ? "Brand"
      : profile?.role === "designer"
        ? "Designer"
        : "—";

  return (
    <div className="bg-white flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-wrap gap-2">
        {ACCOUNTS.map((account) => {
          const isActive = profile?.email === account.email;
          return (
            <button
              key={account.email}
              type="button"
              disabled={isLoading}
              onClick={() => void signInAs(account.email, account.password) }
              className={[
                "min-h-9 min-w-[10rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-black",
                isLoading
                  ? "flex items-center justify-center border border-neutral-200 bg-neutral-50"
                  : isActive
                    ? "text-white shadow-sm"
                    : "border border-neutral-300 bg-transparent text-neutral-800 hover:bg-neutral-50",
              ].join(" ")}
              style={
                isActive && !isLoading
                  ? { backgroundColor: "var(--role-accent)" }
                  : undefined
              }
            >
              { isLoading ? <Spinner /> : account.display}
            </button>
          );
        })}
      </div>
      <div
        className={[
          "inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-xs font-medium",
          roleBadgeClass(profile?.role ?? null),
        ].join(" ")}
      >
        Signed in as {displayName} · {roleLabel}
      </div>
    </div>
  );
}
