export const TOKEN_STORAGE_KEY = 'talenthive_token';
export const LEGACY_TOKEN_STORAGE_KEY = 'campus_connect_token';
export const LANGUAGE_STORAGE_KEY = 'talenthive_language';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'campus_connect_language';

export function getStoredValue(primaryKey, legacyKey) {
  return localStorage.getItem(primaryKey) || (legacyKey ? localStorage.getItem(legacyKey) : null);
}

export function migrateStoredValue(primaryKey, legacyKey) {
  const currentValue = localStorage.getItem(primaryKey);

  if (currentValue) {
    return currentValue;
  }

  if (!legacyKey) {
    return null;
  }

  const legacyValue = localStorage.getItem(legacyKey);

  if (legacyValue) {
    localStorage.setItem(primaryKey, legacyValue);
    localStorage.removeItem(legacyKey);
  }

  return legacyValue;
}

export function setStoredValue(primaryKey, value, legacyKey) {
  localStorage.setItem(primaryKey, value);

  if (legacyKey) {
    localStorage.removeItem(legacyKey);
  }
}

export function clearStoredValue(primaryKey, legacyKey) {
  localStorage.removeItem(primaryKey);

  if (legacyKey) {
    localStorage.removeItem(legacyKey);
  }
}
