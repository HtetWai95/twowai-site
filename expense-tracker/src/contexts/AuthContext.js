import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function register(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profileData = {
      id: cred.user.uid,
      name,
      email: email.toLowerCase().trim(),
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profileData);
    setProfile(profileData);
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profileSnap = await getDoc(doc(db, 'users', cred.user.uid));
    if (profileSnap.exists()) setProfile(profileSnap.data());
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  const value = {
    user,
    profile,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
