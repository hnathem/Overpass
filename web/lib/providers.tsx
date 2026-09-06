"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { Contact, Metrics, Meta, RequestRow, Satellite, Station } from "./types";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function loadJson<T>(name: string): Promise<T> {
  const response = await fetch(`${BASE}/data/${name}.json`);
  if (!response.ok) {
    throw new Error(`Could not load ${name}.json (${response.status})`);
  }
  return (await response.json()) as T;
}

/* ---------- Theme (dark-first) ---------- */

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ---------- Data ---------- */

export interface Data {
  meta: Meta;
  satellites: Satellite[];
  stations: Station[];
  contacts: Contact[];
  requests: RequestRow[];
  metrics: Metrics;
}

interface DataContextValue {
  loading: boolean;
  error: string | null;
  data: Data | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("overpass-theme", next);
    } catch {
      // Ignore storage errors; the toggle still works for the session.
    }
    setTheme(next);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      loadJson<Meta>("meta"),
      loadJson<Satellite[]>("satellites"),
      loadJson<Station[]>("stations"),
      loadJson<Contact[]>("contacts"),
      loadJson<RequestRow[]>("requests"),
      loadJson<Metrics>("metrics"),
    ])
      .then(([meta, satellites, stations, contacts, requests, metrics]) => {
        if (active) setData({ meta, satellites, stations, contacts, requests, metrics });
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <DataContext.Provider value={{ loading: !data && !error, error, data }}>
        {children}
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <AppProviders>.");
  return value;
}

export function useData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData must be used inside <AppProviders>.");
  return value;
}
