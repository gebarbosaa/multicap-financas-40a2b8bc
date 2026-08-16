import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { Btn } from "@/components/ui-kit";

const CODIGO = "GK140626";
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          entrar();
        }}
        className="panel animate-section w-full max-w-sm p-7"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <span className="size-3.5 rounded-full bg-primary" />
          <span className="font-display text-lg font-bold tracking-tight">MULTICAP</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">Acesso do domicílio</h1>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          Digite o código de acesso para entrar
        </p>

        <label className="mt-6 block">
          <span className="label-xs">Código de acesso</span>
          <input
            autoFocus
            className="field num tracking-[0.25em]"
            value={codigo}
            placeholder="••••••••"
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setErro(false);
            }}
          />
        </label>

        {erro ? (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[11px] font-bold text-destructive">
            Código incorreto, tente novamente
          </p>
        ) : null}

        <Btn type="submit" className="mt-6 w-full py-3">
          <Lock size={15} /> Entrar
        </Btn>

        <p
          className="mt-6 rounded-lg px-3 py-2 text-center text-[10px] font-bold text-foreground/70"
          style={{ background: "var(--color-rosa)" }}
        >
          Geovanna &amp; Karen
        </p>
      </form>
    </div>
  );
}
