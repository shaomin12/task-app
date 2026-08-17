"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface UserPrefs {
  dateFormat: string;
  weekStartsOn: 0 | 1;
}

const DEFAULT_PREFS: UserPrefs = { dateFormat: "MMM d, yyyy", weekStartsOn: 1 };

const UserPrefsContext = createContext<UserPrefs>(DEFAULT_PREFS);

export function UserPrefsProvider({
  prefs,
  children,
}: {
  prefs: UserPrefs;
  children: ReactNode;
}) {
  return <UserPrefsContext.Provider value={prefs}>{children}</UserPrefsContext.Provider>;
}

export function useUserPrefs() {
  return useContext(UserPrefsContext);
}
