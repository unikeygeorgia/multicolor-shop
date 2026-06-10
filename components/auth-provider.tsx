"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

interface AuthResult {
  error: string | null;
}

interface AuthValue {
  ready: boolean;
  user: User | null;
  session: Session | null;
  signInPassword: (email: string, password: string) => Promise<AuthResult>;
  signUpPassword: (
    email: string,
    password: string,
    meta?: Record<string, unknown>
  ) => Promise<AuthResult & { needsConfirm?: boolean }>;
  signInGoogle: () => Promise<AuthResult>;
  sendPhoneOtp: (phone: string) => Promise<AuthResult>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const NOT_CONFIGURED: AuthResult = { error: "ავტორიზაცია არ არის კონფიგურირებული" };

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUpPassword = useCallback(
    async (email: string, password: string, meta?: Record<string, unknown>) => {
      if (!supabase) return NOT_CONFIGURED;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
      });
      if (error) return { error: error.message };
      // Supabase returns an obfuscated user with empty identities if the email already exists
      const needsConfirm = !data.session;
      return { error: null, needsConfirm };
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    return { error: error?.message ?? null };
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message ?? null };
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    if (!supabase) return NOT_CONFIGURED;
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      user: session?.user ?? null,
      session,
      signInPassword,
      signUpPassword,
      signInGoogle,
      sendPhoneOtp,
      verifyPhoneOtp,
      signOut,
    }),
    [ready, session, signInPassword, signUpPassword, signInGoogle, sendPhoneOtp, verifyPhoneOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
