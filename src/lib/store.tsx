import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dadosIniciais, type AppData } from "./finance";

const KEY = "multicap:data:v1";

interface Ctx {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
  substituirTudo: (d: AppData) => void;
  resetar: () => void;
  pronto: boolean;
}

const StoreContext = createContext<Ctx | null>(null);

function merge(raw: unknown): AppData {
  const base = dadosIniciais();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppData>;
  return {
    ...base,
    ...r,
    config: { ...base.config, ...(r.config ?? {}) },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => dadosIniciais());
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDataState(merge(JSON.parse(raw)));
    } catch {
      /* ignora */
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignora */
    }
  }, [data, pronto]);

  const value = useMemo<Ctx>(
    () => ({
      data,
      pronto,
      setData: (fn) => setDataState((d) => fn(d)),
      substituirTudo: (d) => setDataState(merge(d)),
      resetar: () => setDataState(dadosIniciais()),
    }),
    [data, pronto],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa do StoreProvider");
  return ctx;
}
