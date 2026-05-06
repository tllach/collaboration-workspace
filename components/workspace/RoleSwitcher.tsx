"use client";

import { useAuth } from "@/lib/auth/context";

const ACCOUNTS = [
  {
    email: "brand1@briefed.app",
    password: process.env.PASSWORD_SALT!,
    display: "Sofia · Brand",
  },
  {
    email: "brand2@briefed.app",
    password: process.env.PASSWORD_SALT!,
    display: "Carlos · Brand",
  },
  {
    email: "designer@briefed.app",
    password: process.env.PASSWORD_SALT!,
    display: "Alex · Designer",
  },
] as const;

function accountFirstName(display: string): string {
  const beforeSep = display.split("·")[0]?.trim() ?? "";
  const firstWord = beforeSep.split(/\s+/)[0] ?? "";
  return firstWord || display;
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
    <div className="flex w-full items-center justify-between gap-3 border border-[color:var(--border-accent)] bg-[var(--surface)] px-3 py-2">
      <div className="flex min-w-0 items-center gap-1">
        {ACCOUNTS.map((account) => {
          const isActive = profile?.email === account.email;
          const label = accountFirstName(account.display);
          return (
            <button
              key={account.email}
              type="button"
              disabled={isLoading}
              onClick={() =>
                void signInAs(account.email, account.password!).then(() => {
                  window.location.replace("/");
                })  
              }
              className={[
                "h-8 rounded-lg px-3 text-xs transition-colors",
                isActive
                  ? "border border-transparent bg-[#9fff1a] font-semibold text-[#081e28]"
                  : "border border-[color:var(--border-soft)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[color:var(--border-accent)] hover:text-white",
              ].join(" ")}
              title={account.display}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--foreground)]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#9fff1a]" aria-hidden />
        <span className="min-w-0 truncate">{displayName}</span>
        <span className="rounded bg-[var(--role-accent-light)] px-1.5 py-0.5 text-[10px] text-[var(--role-accent)]">
          {roleLabel}
        </span>
      </div>
    </div>
  );
}