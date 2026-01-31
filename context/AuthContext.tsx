/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  signup: (username: string, email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Only restore if businessId is valid
        if (parsed && parsed.businessId && parsed.businessId !== 'unknown') {
            setUser(parsed);
        } else {
            localStorage.removeItem('currentUser');
        }
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{success: boolean, error?: string}> => {
    try {
      const loggedUser = await Api.login(email, password);
      if (loggedUser) {
        // Manually clone to ensure a plain serializable object
        const cleanUser: User = {
            id: loggedUser.id,
            businessId: loggedUser.businessId,
            username: loggedUser.username,
            email: loggedUser.email,
            role: loggedUser.role,
            isActive: loggedUser.isActive,
            createdAt: loggedUser.createdAt
        };
        setUser(cleanUser);
        localStorage.setItem('currentUser', JSON.stringify(cleanUser));
        return { success: true };
      }
      return { success: false, error: 'User record not found.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<{success: boolean, error?: string}> => {
      try {
          // Fix: Call Api.signup with individual arguments as expected by the SupabaseService implementation
          const createdUser = await Api.signup(username, email, password);
          if (createdUser) {
              const cleanUser: User = {
                  id: createdUser.id,
                  businessId: createdUser.businessId,
                  username: createdUser.username,
                  email: createdUser.email,
                  role: createdUser.role,
                  isActive: createdUser.isActive,
                  createdAt: createdUser.createdAt
              };
              setUser(cleanUser);
              localStorage.setItem('currentUser', JSON.stringify(cleanUser));
              return { success: true };
          }
          return { success: false, error: 'Registration failed.' };
      } catch (e: any) {
          return { success: false, error: e.message };
      }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);