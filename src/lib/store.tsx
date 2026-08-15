import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { dadosIniciais, type AppData } from "./finance";
import { carregarDados, salvarDados } from "./multicap.functions";
import { CODIGO_ACESSO } from "@/components/PortaAcesso";

const KEY = "multicap:data:v1";

// Identifica esta aba/aparelho para não "ecoar" a própria escrita quando
// buscamos novidades feitas em outro aparelho.
const SESSAO_ID = Math.random().toString(36).slice(2);


interface Ctx {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
  substituirTudo: (d: AppData) => void;
  resetar: () => void;
  pronto: boolean;
  sincronizando: boolean;
  erroSincronizacao: boolean;
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
  const [sincronizando, setSincronizando] = useState(false);
  const [erroSincronizacao, setErroSincronizacao] = useState(false);

  const salvarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carregouRemoto = useRef(false);

  // 1) Carrega rápido do que já está salvo neste aparelho, e em seguida busca
  // a versão mais atual na nuvem (é ela que vale, pois pode ter sido editada
  // em outro aparelho). O servidor confere o código do domicílio.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDataState(merge(JSON.parse(raw)));
    } catch {
      /* ignora */
    }

    (async () => {
      try {
        const remoto = await carregarDados({ data: { codigo: CODIGO_ACESSO } });

        if (remoto?.dados) {
          setDataState(merge(remoto.dados));
        } else {
          // Primeira vez que este código sincroniza: envia o que já existir
          // localmente (ou os dados iniciais) para criar o registro remoto.
          let atual: AppData = dadosIniciais();
          try {
            const raw = window.localStorage.getItem(KEY);
            if (raw) atual = merge(JSON.parse(raw));
          } catch {
            /* ignora */
          }
          await salvarDados({
            data: { codigo: CODIGO_ACESSO, dados: atual, sessao: SESSAO_ID },
          });
        }
        setErroSincronizacao(false);
      } catch {
        // Sem conexão: o app continua funcionando só com os dados deste aparelho.
        setErroSincronizacao(true);
      } finally {
        carregouRemoto.current = true;
        setPronto(true);
      }
    })();
  }, []);

  // 2) Sempre grava uma cópia local (funciona offline e evita tela em branco
  // ao reabrir antes da sincronização terminar).
  useEffect(() => {
    if (!pronto) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignora */
    }
  }, [data, pronto]);

  // 3) Envia para a nuvem (com um pequeno atraso para agrupar edições
  // rápidas em seguida, tipo digitar em um campo).
  useEffect(() => {
    if (!pronto || !carregouRemoto.current) return;

    if (salvarTimeout.current) clearTimeout(salvarTimeout.current);
    salvarTimeout.current = setTimeout(async () => {
      setSincronizando(true);
      try {
        await salvarDados({
          data: { codigo: CODIGO_ACESSO, dados, sessao: SESSAO_ID },
        });
        setErroSincronizacao(false);
      } catch {
        setErroSincronizacao(true);
      } finally {
        setSincronizando(false);
      }
    }, 700);

    return () => {
      if (salvarTimeout.current) clearTimeout(salvarTimeout.current);
    };
  }, [data, pronto]);

  // 4) De tempos em tempos busca mudanças feitas em outro aparelho.
  useEffect(() => {
    if (!pronto) return;
    const timer = setInterval(async () => {
      if (salvarTimeout.current) return; // há edição local pendente, não sobrescreve
      try {
        const remoto = await carregarDados({ data: { codigo: CODIGO_ACESSO } });
        if (remoto?.dados && remoto.atualizado_por !== SESSAO_ID) {
          setDataState(merge(remoto.dados));
        }
      } catch {
        /* ignora */
      }
    }, 20000);

    return () => clearInterval(timer);
  }, [pronto]);


  const value = useMemo<Ctx>(
    () => ({
      data,
      pronto,
      sincronizando,
      erroSincronizacao,
      setData: (fn) => setDataState((d) => fn(d)),
      substituirTudo: (d) => setDataState(merge(d)),
      resetar: () => setDataState(dadosIniciais()),
    }),
    [data, pronto, sincronizando, erroSincronizacao],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa do StoreProvider");
  return ctx;
}
