import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getUser, logout } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const auth = await isAuthenticated();
      if (auth) {
        const userData = await getUser();
        setUser(userData);
        setAuthenticated(true);
      }
    } catch (err) {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = (userData) => {
    setUser(userData);
    setAuthenticated(true);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);