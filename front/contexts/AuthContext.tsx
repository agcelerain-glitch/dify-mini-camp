'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

function toAppUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }): AppUser {
  const name =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    supabaseUser.email?.split('@')[0] ??
    'User';
  return {
    id: supabaseUser.id,
    name,
    email: supabaseUser.email ?? '',
    avatar: name.charAt(0).toUpperCase(),
  };
}

type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 初期セッション取得
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? toAppUser(u) : null);
      setIsLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAppUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function signIn() {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
