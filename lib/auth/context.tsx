"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signInAs: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // this is used to refresh the profile when the user is signed in
  const [profileRefreshNonce, setProfileRefreshNonce] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;

    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
        try {
          const p = await fetchProfile(session.user.id);
          if (!cancelled) setProfile(p);
        } catch {
          if (!cancelled) setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      if (!cancelled) setIsLoading(false);
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!session?.user) return;
        setUser(session.user);
        // this will trigger a profile refresh
        setProfileRefreshNonce((value) => value + 1);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);


  // this is used to refresh the profile when the user is signed in
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    void (async () => {
      try {
        const p = await fetchProfile(user.id);
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profileRefreshNonce, fetchProfile]);

  const signInAs = useCallback(
    async (email: string, password: string) => {
      setProfile(null);
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      // SIGNED_IN → onAuthStateChange loads profile and clears isLoading
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      signInAs,
      signOut,
    }),
    [user, profile, isLoading, signInAs, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
