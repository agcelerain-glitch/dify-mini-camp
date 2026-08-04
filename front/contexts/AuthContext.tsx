'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getMockUser, setMockUser, clearMockUser, MockUser } from '@/lib/mock-store';

type AuthContextType = {
  user: MockUser | null;
  isLoading: boolean;
  signIn: (name?: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getMockUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  function signIn(name = 'テストユーザー') {
    const mockUser: MockUser = {
      id: 'mock-user-001',
      name,
      email: 'test@example.com',
      avatar: name.charAt(0).toUpperCase(),
    };
    setMockUser(mockUser);
    setUser(mockUser);
  }

  function signOut() {
    clearMockUser();
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
