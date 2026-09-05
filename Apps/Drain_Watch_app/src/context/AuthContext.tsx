import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  bypassAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  bypassAuth: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const bypassAuth = () => {
    // Set a lightweight mock user session for testing/bypassing auth
    setUser({
      uid: 'dev-bypass-user-id',
      email: 'demo-user@example.com',
      displayName: 'Demo Developer',
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, bypassAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
