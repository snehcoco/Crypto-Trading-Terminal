import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/api';

const DEMO_USER = {
  _id: 'demo',
  name: 'Demo Trader',
  email: 'demo@cryptoterminal.io',
  virtualBalance: 10000,
  isDemo: true,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore demo session without hitting the backend
    if (localStorage.getItem('demo') === 'true') {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('token', res.data.token);
    // Store only the user object, not the token, to match what getMe() returns
    const { token, ...userData } = res.data;
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    localStorage.setItem('token', res.data.token);
    // Store only the user object, not the token, to match what getMe() returns
    const { token, ...userData } = res.data;
    setUser(userData);
    return userData;
  };

  const loginDemo = () => {
    localStorage.setItem('demo', 'true');
    setUser(DEMO_USER);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('demo');
    setUser(null);
  };

  const updateBalance = (newBalance) => {
    setUser((prev) => ({ ...prev, virtualBalance: newBalance }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, register, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
