import { useState, useContext, createContext, useEffect } from 'react';
import { login } from './db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (username, password) => {
    const result = await login(username, password);
    if (result) {
      const userData = {
        id: result.id,
        username: result.username,
        nama: result.nama || '',
        alamat: result.alamat || ''
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (updates) => {
    setUser((current) => {
      if (!current) {
        return current;
      }
      const nextUser = { ...current, ...updates };
      localStorage.setItem('user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '24px'
  }
};
