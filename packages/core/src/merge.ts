import type { Login } from './domain/login.js';

/** Merge two login lists by id; higher updatedAt wins. */
export function mergeLogins(local: Login[], remote: Login[]): Login[] {
  const map = new Map<string, Login>();
  for (const login of remote) map.set(login.id, login);
  for (const login of local) {
    const existing = map.get(login.id);
    if (!existing || new Date(login.updatedAt) > new Date(existing.updatedAt)) {
      map.set(login.id, login);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
