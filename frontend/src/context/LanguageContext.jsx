import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import {
  DEFAULT_LANGUAGE,
  getLanguageLocale,
  isSupportedLanguage,
  translateApiMessage,
  translateText
} from '../i18n/translations';
import { useAuth } from './AuthContext';
import {
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  migrateStoredValue,
  setStoredValue
} from '../utils/storage';

const initialFrenchVerification = {
  status: 'idle',
  email: '',
  message: '',
  error: '',
  loading: false,
  verifying: false
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [language, setLanguage] = useState(
    () => migrateStoredValue(LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE
  );
  const [frenchVerification, setFrenchVerification] = useState(initialFrenchVerification);

  useEffect(() => {
    const nextLanguage =
      user?.language || migrateStoredValue(LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
    setLanguage((current) => (current === nextLanguage ? current : nextLanguage));
  }, [user?.language]);

  useEffect(() => {
    setStoredValue(LANGUAGE_STORAGE_KEY, language, LEGACY_LANGUAGE_STORAGE_KEY);
    document.documentElement.lang = getLanguageLocale(language);
  }, [language]);

  function t(key, values) {
    return translateText(language, key, values);
  }

  function translateMessage(message) {
    return translateApiMessage(message, t);
  }

  function persistLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    setStoredValue(LANGUAGE_STORAGE_KEY, nextLanguage, LEGACY_LANGUAGE_STORAGE_KEY);
    document.documentElement.lang = getLanguageLocale(nextLanguage);
  }

  function clearFrenchVerification() {
    setFrenchVerification(initialFrenchVerification);
  }

  async function requestFrenchVerification() {
    if (!user) {
      const error = t('languageFrenchLoginRequired');
      setFrenchVerification({ ...initialFrenchVerification, error });
      return { error };
    }

    if (!user.email) {
      const error = t('languageFrenchEmailRequired');
      setFrenchVerification({ ...initialFrenchVerification, error });
      return { error };
    }

    setFrenchVerification({
      ...initialFrenchVerification,
      status: 'pending',
      email: user.email,
      loading: true
    });

    try {
      const { data } = await api.post('/users/language/request-french-otp');
      const message = [translateMessage(data.message), data.devHint ? translateMessage(data.devHint) : '']
        .filter(Boolean)
        .join(' ');

      setFrenchVerification({
        status: 'pending',
        email: user.email,
        message: message || t('languageFrenchCodePrompt'),
        error: '',
        loading: false,
        verifying: false
      });

      return { requiresVerification: true, message };
    } catch (error) {
      const message = translateMessage(error.response?.data?.message || t('apiFrenchRequiresVerification'));
      setFrenchVerification({
        ...initialFrenchVerification,
        status: 'idle',
        email: user.email,
        error: message
      });
      return { error: message };
    }
  }

  async function changeLanguage(nextLanguage) {
    const normalizedLanguage = String(nextLanguage || '').trim().toLowerCase();

    if (!isSupportedLanguage(normalizedLanguage)) {
      const error = t('apiUnsupportedLanguage');
      return { error };
    }

    if (normalizedLanguage === 'fr') {
      return requestFrenchVerification();
    }

    clearFrenchVerification();

    try {
      if (user) {
        const { data } = await api.patch('/users/language', { language: normalizedLanguage });
        persistLanguage(data.user?.language || normalizedLanguage);
        await refreshUser();
      } else {
        persistLanguage(normalizedLanguage);
      }

      return { ok: true };
    } catch (error) {
      return {
        error: translateMessage(error.response?.data?.message || t('apiUnsupportedLanguage'))
      };
    }
  }

  async function verifyFrenchLanguage(code) {
    const normalizedCode = String(code || '').trim();

    if (!normalizedCode) {
      const error = t('languageFrenchCodeRequired');
      setFrenchVerification((current) => ({ ...current, error }));
      return { error };
    }

    setFrenchVerification((current) => ({ ...current, verifying: true, error: '' }));

    try {
      const { data } = await api.post('/users/language/verify-french-otp', { code: normalizedCode });
      persistLanguage('fr');
      await refreshUser();

      const message = translateMessage(data.message || t('languageFrenchSuccess'));
      setFrenchVerification({
        status: 'verified',
        email: user?.email || '',
        message,
        error: '',
        loading: false,
        verifying: false
      });

      return { ok: true, message };
    } catch (error) {
      const message = translateMessage(error.response?.data?.message || t('apiFrenchInvalidCode'));
      setFrenchVerification((current) => ({
        ...current,
        verifying: false,
        error: message
      }));
      return { error: message };
    }
  }

  function formatDateTime(value) {
    return new Intl.DateTimeFormat(getLanguageLocale(language), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  function getPostingStatusLabel(status) {
    if (!status) return t('postingStatusLoading');
    if (status.unlimited) return t('postingStatusUnlimited');
    if (status.limit === 2) return t('postingStatusTwoPosts');
    return t('postingStatusOnePost');
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        t,
        translateMessage,
        changeLanguage,
        requestFrenchVerification,
        verifyFrenchLanguage,
        clearFrenchVerification,
        frenchVerification,
        formatDateTime,
        getPostingStatusLabel
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
