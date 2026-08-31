'use client';

import { createContext, useContext, useState } from 'react';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

const AuthContext = createContext(null);

function AuthProviderInner({ children }) {
  const { data: session, status } = useSession();
  const [error, setError] = useState('');

  const isLoading = status === 'loading';
  // NextAuth menyimpan data user di session.user
  const user = session?.user ? {
    ...session.user,
    roleLabel: session.user.roleName || 'No Role'
  } : null;

  const login = async (email, password) => {
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    
    if (res?.error) {
      setError(res.error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    // Redirect false agar kita bisa handle manual navigasi (atau biarkan next-auth reload)
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  const restoreSession = () => {
    // NextAuth otomatis menangani restore session di background
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, restoreSession, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
