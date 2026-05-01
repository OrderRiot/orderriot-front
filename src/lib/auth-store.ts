// Token persistence — single source of truth for access/refresh tokens.
// Kept in localStorage so the user stays logged in across reloads.

const ACCESS_KEY = "orderriot.access";
const REFRESH_KEY = "orderriot.refresh";

type Listener = () => void;
const listeners = new Set<Listener>();

export const tokenStore = {
  access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    listeners.forEach((l) => l());
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
