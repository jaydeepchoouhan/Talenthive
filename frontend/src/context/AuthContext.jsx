import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import {
  clearStoredValue,
  LEGACY_TOKEN_STORAGE_KEY,
  migrateStoredValue,
  setStoredValue,
  TOKEN_STORAGE_KEY
} from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => migrateStoredValue(TOKEN_STORAGE_KEY, LEGACY_TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (error) {
        clearStoredValue(TOKEN_STORAGE_KEY, LEGACY_TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      async login(identifier, password) {
        const { data } = await api.post('/auth/login', { identifier, password });
        if (data.token) {
          setStoredValue(TOKEN_STORAGE_KEY, data.token, LEGACY_TOKEN_STORAGE_KEY);
          setToken(data.token);
          setUser(data.user);
        }
        return data;
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        if (data.token) {
          setStoredValue(TOKEN_STORAGE_KEY, data.token, LEGACY_TOKEN_STORAGE_KEY);
          setToken(data.token);
          setUser(data.user);
        }
        return data;
      },
      async verifyAccount(identifier, code) {
        const { data } = await api.post('/auth/verify-account', { identifier, code });
        return data;
      },
      async resendAccountVerificationOtp(identifier) {
        const { data } = await api.post('/auth/resend-account-otp', { identifier });
        return data;
      },
      async verifyLoginOtp(identifier, code) {
        const { data } = await api.post('/auth/verify-login-otp', { identifier, code });
        setStoredValue(TOKEN_STORAGE_KEY, data.token, LEGACY_TOKEN_STORAGE_KEY);
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      async resendLoginOtp(identifier) {
        const { data } = await api.post('/auth/resend-login-otp', { identifier });
        return data;
      },
      logout() {
        clearStoredValue(TOKEN_STORAGE_KEY, LEGACY_TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      },
      refreshUser: async () => {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
