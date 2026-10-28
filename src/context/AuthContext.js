import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/api';

const AuthContext = createContext(null);
const DEMO_SESSION_KEY = 'demo-session';
const DEMO_USER = {
  _id: 'demo-user',
  name: 'Demo Trader',
  email: 'demo@cryptoterminal.io',
  virtualBalance: 100000,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(DEMO_SESSION_KEY) === 'true') {
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

  const loginDemo = () => {
    localStorage.removeItem('token');
    localStorage.setItem(DEMO_SESSION_KEY, 'true');
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    localStorage.setItem('token', res.data.token);
    // Store only the user object, not the token, to match what getMe() returns
    const { token, ...userData } = res.data;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(DEMO_SESSION_KEY);
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
