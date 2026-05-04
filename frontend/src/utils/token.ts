const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const token = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setAccess: (t: string) => localStorage.setItem(ACCESS_KEY, t),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
