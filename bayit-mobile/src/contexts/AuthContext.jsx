import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);
const ADMIN_EMAILS = ['foreverram03@gmail.com'];

const resolveRole = (firebaseUser) => {
  if (!firebaseUser) return null;
  const email = String(firebaseUser.email || '').toLowerCase();
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || firebaseUser.email,
    role: ADMIN_EMAILS.includes(email) ? 'admin' : 'editor',
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? resolveRole(firebaseUser) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return resolveRole(cred.user);
  };

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return resolveRole({ ...cred.user, displayName: name });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, forgotPassword }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
