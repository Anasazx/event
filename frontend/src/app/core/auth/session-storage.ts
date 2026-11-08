import { StoredSession } from './session.model';

const KEY = 'eventhub.session';

/** Reads/writes the session in localStorage. Any malformed value is discarded. */
export const sessionStorageAdapter = {
  read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as StoredSession;
      return parsed?.token && parsed?.user ? parsed : null;
    } catch {
      return null;
    }
  },
  write(session: StoredSession): void {
    localStorage.setItem(KEY, JSON.stringify(session));
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
};
