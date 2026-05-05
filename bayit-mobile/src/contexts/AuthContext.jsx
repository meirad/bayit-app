import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);
const ADMIN_EMAILS = ['foreverram03@gmail.com'];

const resolveRole = (user) => {
  if (!user) {
    return null;
  }

  const email = String(user.email || '').toLowerCase();
  const role = ADMIN_EMAILS.includes(email) ? 'admin' : (user.role || 'editor');
  return { ...user, role };
};

const persistSession = async ({ accessToken, refreshToken, user }) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(user));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await SecureStore.getItemAsync('user');
        if (raw) {
          setUser(resolveRole(JSON.parse(raw)));
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await logout();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const nextUser = resolveRole(data.user);
    await persistSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: nextUser,
    });
    setUser(nextUser);
    return nextUser;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });

    if (data?.accessToken && data?.refreshToken && data?.user) {
      const nextUser = resolveRole(data.user);
      await persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: nextUser,
      });
      setUser(nextUser);
      return nextUser;
    }

    return login(email, password);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
