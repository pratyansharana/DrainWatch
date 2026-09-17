import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('authority_user');
    return saved ? JSON.parse(saved) : {
      id: 'usr-ddma',
      name: 'Ashwani Kumar, IAS',
      role: 'DDMA_DIVISIONAL_COMMISSIONER',
      department: 'Delhi Disaster Management Authority (DDMA)',
      designation: 'Principal Secretary & Divisional Commissioner',
      badge: 'DDMA-01'
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('authority_token') || 'delhi-authority-session');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('authority_token'));
  });

  // Attach token to axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const loginWithCredentials = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem('authority_token', userToken);
    localStorage.setItem('authority_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authority_token');
    localStorage.removeItem('authority_user');
  };

  const switchRole = async (newRole) => {
    try {
      const res = await axios.post('/api/auth/login', { roleQuickSwitch: newRole });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        setToken(res.data.token);
        setIsAuthenticated(true);
        localStorage.setItem('authority_token', res.data.token);
        localStorage.setItem('authority_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error('Failed to switch role:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loginWithCredentials,
      logout,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);