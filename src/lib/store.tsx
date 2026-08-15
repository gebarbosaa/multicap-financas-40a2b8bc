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
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { CODIGO_ACESSO } from "@/components/PortaAcesso";

const KEY = "multicap:data:v1";
const TABELA = "multicap_dados";

// A tabela é criada pela migration do Supabase; enquanto os tipos gerados não
// a incluem, usamos este helper para manter o código compilável sem perder a
// tipagem de runtime.
const tabela = () => (supabase as any).from(TABELA);

// Identifica esta aba/aparelho para não "ecoar" a própria escrita quando o
// tempo real avisa que a linha mudou.
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
  // a versão mais atual no Supabase (é ela que vale, pois pode ter sido
  // editada em outro aparelho).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setDataState(merge(JSON.parse(raw)));
    } catch {
      /* ignora */
    }

    (async () => {
      try {
        const { data: linha, error } = await tabela()
          .select("dados")
          .eq("codigo", CODIGO_ACESSO)
          .maybeSingle();

        if (error) throw error;

        if (linha?.dados) {
          setDataState(merge(linha.dados));
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
          await supabase.from(TABELA).upsert({
            codigo: CODIGO_ACESSO,
            dados: atual as unknown as Json,
            atualizado_por: SESSAO_ID,
          });
        }
        setErroSincronizacao(false);
      } catch {
        // Sem conexão, ou a tabela/migration ainda não foi criada no Supabase:
        // o app continua funcionando só com os dados deste aparelho.
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

  // 3) Envia para o Supabase (com um pequeno atraso para agrupar edições
  // rápidas em seguida, tipo digitar em um campo).
  useEffect(() => {
    if (!pronto || !carregouRemoto.current) return;

    if (salvarTimeout.current) clearTimeout(salvarTimeout.current);
    salvarTimeout.current = setTimeout(async () => {
      setSincronizando(true);
      try {
        const { error } = await supabase.from(TABELA).upsert({
          codigo: CODIGO_ACESSO,
          dados: data as unknown as Json,
          atualizado_por: SESSAO_ID,
        });
        if (error) throw error;
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

  // 4) Escuta mudanças feitas em outro aparelho e atualiza a tela na hora.
  useEffect(() => {
    const canal = supabase
      .channel(`multicap-dados-${CODIGO_ACESSO}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: TABELA,
          filter: `codigo=eq.${CODIGO_ACESSO}`,
        },
        (payload) => {
          const novo = payload.new as { dados?: AppData; atualizado_por?: string } | null;
          if (!novo?.dados) return;
          if (novo.atualizado_por === SESSAO_ID) return; // é a própria escrita voltando, ignora
          setDataState(merge(novo.dados));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

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
