'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { mockUsers, mockRoles } from '@/lib/mock';
import { ROLE_LABELS } from '@/lib/rbac';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const found = mockUsers.find(
      u => u.email === email && u.password === password
    );
    
    if (found) {
      // Get all permissions from user's roles
      const userPermissions = new Set();
      const roleLabels = [];
      
      if (found.roles && found.roles.length > 0) {
        found.roles.forEach(roleId => {
          const roleObj = mockRoles.find(r => r.id === roleId);
          if (roleObj) {
            roleLabels.push(roleObj.name);
            roleObj.permissions.forEach(p => userPermissions.add(p));
          }
        });
      }
      
      const userData = {
        ...found,
        permissions: Array.from(userPermissions),
        roleLabel: roleLabels.length > 0 ? roleLabels.join(', ') : 'No Role',
      };
      
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bm_user', JSON.stringify(userData));
      }
      setIsLoading(false);
      return true;
    } else {
      setError('Email atau password salah');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bm_user');
    }
  }, []);

  const restoreSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bm_user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {
          localStorage.removeItem('bm_user');
        }
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, restoreSession, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
