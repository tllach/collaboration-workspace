"use client";

import { useEffect } from "react";

import { useAuth } from "@/lib/auth/context";
import type { UserRole } from "@/types";

export function DocumentRole() {
  const { profile } = useAuth();

  useEffect(() => {
    const role = (profile?.role ?? "") as UserRole | "";
    document.documentElement.dataset.role = role;
    return () => {
      document.documentElement.removeAttribute("data-role");
    };
  }, [profile?.role]);

  return null;
}
