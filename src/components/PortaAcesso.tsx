import { useEffect, useState, type ReactNode } from "react";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Btn } from "@/components/ui-kit";

const CODIGO = "GK140626";
// Exportado para o store.tsx usar como identificador do domicílio ao
// sincronizar os dados com o Supabase (mesmo código = mesmos dados).
export const CODIGO_ACESSO = CODIGO;
export const CHAVE_ACESSO = "multicap:acesso:v1";

export function encerrarSessao() {
  try {
    window.localStorage.removeItem(CHAVE_ACESSO);
  } catch {
    /* ignora */
  }
  window.location.reload();
}

export default function PortaAcesso({ children }: { children: ReactNode }) {
  const [liberado, setLiberado] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE_ACESSO) === "ok") setLiberado(true);
    } catch {
      /* ignora */
    }
    setPronto(true);
  }, []);

  if (!pronto) return null;
  if (liberado) return <>{children}</>;

  const entrar = () => {
    if (codigo.trim().toUpperCase() === CODIGO) {
      try {
        window.localStorage.setItem(CHAVE_ACESSO, "ok");
      } catch {
        /* ignora */
      }
      setLiberado(true);
    } else {
      setErro(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full blur-3xl"
        style={{ background: "oklch(0.8964 0.2159 126 / 0.16)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 size-[380px] rounded-full blur-3xl"
        style={{ background: "oklch(0.716 0.132 244.6 / 0.12)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="glow mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles size={24} strokeWidth={2.2} />
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">MULTICAP</span>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
            Controle financeiro do domicílio
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            entrar();
          }}
          className="panel animate-section p-7"
        >
          <h1 className="text-lg font-bold tracking-tight">Acesso do domicílio</h1>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Digite o código de acesso para entrar
          </p>

          <label className="mt-6 block">
            <span className="label-xs">Código de acesso</span>
            <input
              autoFocus
              className="field num text-center text-base tracking-[0.4em]"
              value={codigo}
              placeholder="········"
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                setErro(false);
              }}
            />
          </label>

          {erro ? (
            <p className="mt-3 rounded-xl bg-destructive/15 px-3 py-2 text-[11px] font-bold text-destructive">
              Código incorreto, tente novamente
            </p>
          ) : null}

          <Btn type="submit" className="mt-6 w-full py-3">
            <Lock size={15} /> Entrar
          </Btn>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <ShieldCheck size={13} /> Seus dados ficam salvos e sincronizados com segurança
          </p>
        </form>

        <p className="mt-5 text-center text-[10px] font-bold tracking-wide text-muted-foreground">
          Geovanna &amp; Karen
        </p>
      </div>
    </div>
  );
}
