import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const ADMIN_EMAILS = ['foreverram03@gmail.com'];

const withResolvedRole = (user) => {
  if (!user) return null;
  const email = String(user.email || '').toLowerCase();
  const role = ADMIN_EMAILS.includes(email) ? 'admin' : (user.role || 'editor');
  return { ...user, role };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? withResolvedRole(JSON.parse(stored)) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const resolvedUser = withResolvedRole(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(resolvedUser));
    setUser(resolvedUser);
    return resolvedUser;
  };

  const register = async (name, email, password) => {
    await api.post('/auth/register', { name, email, password });
    return login(email, password);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
