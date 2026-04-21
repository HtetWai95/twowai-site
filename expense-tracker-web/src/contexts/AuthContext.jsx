import { createContext, useContext, useState, useEffect } from 'react';

const USERS_KEY = 'et_users';
const SESSION_KEY = 'et_session_uid';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem(SESSION_KEY);
    if (uid) {
      const found = getUsers().find((u) => u.id === uid);
      if (found) {
        setUser({ uid: found.id, email: found.email });
        setProfile(found);
      }
    }
    setLoading(false);
  }, []);

  async function register(name, email, password) {
    const users = getUsers();
    if (users.some((u) => u.email === email.toLowerCase())) {
      const err = new Error('Email already in use');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
    const newUser = { id: genId(), name, email: email.toLowerCase(), password, createdAt: new Date().toISOString() };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, newUser.id);
    setUser({ uid: newUser.id, email: newUser.email });
    setProfile(newUser);
  }

  async function login(email, password) {
    const found = getUsers().find((u) => u.email === email.toLowerCase() && u.password === password);
    if (!found) {
      const err = new Error('Invalid credentials');
      err.code = 'auth/invalid-credential';
      throw err;
    }
    localStorage.setItem(SESSION_KEY, found.id);
    setUser({ uid: found.id, email: found.email });
    setProfile(found);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
