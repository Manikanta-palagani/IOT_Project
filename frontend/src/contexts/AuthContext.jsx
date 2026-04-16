import { createContext, useContext, useEffect, useState } from 'react';
import { request } from '../lib/api';

const AuthContext = createContext(null);

const storedUser = () => {
  const token = localStorage.getItem('security-token');
  const user = localStorage.getItem('security-user');

  let parsedUser = null;

  if (user) {
    try {
      parsedUser = JSON.parse(user);
    } catch {
      parsedUser = null;
    }
  }

  return {
    token,
    user: parsedUser,
  };
};

const AuthProvider = ({ children }) => {
  const { token: initialToken, user: initialUser } = storedUser();
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(initialUser);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('security-token', token);
    } else {
      localStorage.removeItem('security-token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('security-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('security-user');
    }
  }, [user]);

  const login = async (email, password) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const register = async (email, password) => {
    const response = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, ready, login, logout, register, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export { AuthProvider, useAuth };