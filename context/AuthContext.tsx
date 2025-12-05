
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session simulation
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await Api.login(email, password);
      if (user) {
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
      try {
          // Generate a new Business ID for the registering admin
          const newBusinessId = `biz_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          
          const newUser: User = {
              id: Math.random().toString(36).substr(2, 9),
              businessId: newBusinessId,
              username,
              email,
              password,
              role: 'ADMIN',
              isActive: true,
              createdAt: Date.now()
          };
          const success = await Api.signup(newUser);
          if (success) {
              setUser(newUser);
              localStorage.setItem('currentUser', JSON.stringify(newUser));
              return true;
          }
          return false;
      } catch (e) {
          console.error(e);
          return false;
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
