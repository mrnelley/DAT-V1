export const AUTH_USERNAME_DOMAIN = 'auth.hdcweb.org';

export const normalizeUsername = (value) => (
  String(value || '').trim().toLowerCase()
);

export const getAuthEmailForUsername = (username) => (
  `${normalizeUsername(username)}@${AUTH_USERNAME_DOMAIN}`
);

