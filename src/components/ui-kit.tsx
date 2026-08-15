import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MESES } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {sub ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  titulo,
  acao,
}: {
  children: ReactNode;
  className?: string;
  titulo?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <section className={cn("panel p-5", className)}>
      {titulo ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold tracking-wide">{titulo}</h2>
          {acao}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type BtnVariant = "primary" | "ghost" | "danger" | "soft" | "info";

export function Btn({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
}) {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-primary text-primary-foreground shadow-glow hover:brightness-105",
    info: "bg-info text-on-accent hover:brightness-105",
    danger: "bg-destructive text-destructive-foreground hover:brightness-105",
    soft: "bg-secondary text-foreground border border-border hover:border-primary/60 hover:text-primary",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-surface",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label-xs">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  aberto,
  onClose,
  titulo,
  children,
  largura = "max-w-lg",
}: {
  aberto: boolean;
  onClose: () => void;
  titulo: ReactNode;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    if (!aberto) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aberto, onClose]);

  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "panel animate-section max-h-[88vh] w-full overflow-y-auto p-5 shadow-lift",
          largura,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-base font-bold">{titulo}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useConfirm() {
  const [pedido, setPedido] = useState<{ msg: string; acao: () => void } | null>(null);
  const confirmar = (msg: string, acao: () => void) => setPedido({ msg, acao });
  const elemento = (
    <Modal
      aberto={!!pedido}
      onClose={() => setPedido(null)}
      titulo="Confirmar exclusão"
      largura="max-w-sm"
    >
      <p className="text-xs font-semibold text-muted-foreground">{pedido?.msg}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="soft" onClick={() => setPedido(null)}>
          Cancelar
        </Btn>
        <Btn
          variant="danger"
          onClick={() => {
            pedido?.acao();
            setPedido(null);
          }}
        >
          Excluir
        </Btn>
      </div>
    </Modal>
  );
  return { confirmar, elemento };
}

export function useMes() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const anterior = () => {
    if (mes === 0) {
      setMes(11);
      setAno((a) => a - 1);
    } else setMes((m) => m - 1);
  };
  const proximo = () => {
    if (mes === 11) {
      setMes(0);
      setAno((a) => a + 1);
    } else setMes((m) => m + 1);
  };
  return { mes, ano, anterior, proximo };
}

export function SeletorMes({
  mes,
  ano,
  anterior,
  proximo,
}: {
  mes: number;
  ano: number;
  anterior: () => void;
  proximo: () => void;
}) {
  return (
    <div className="mb-5 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-soft">
      <button
        onClick={anterior}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="num min-w-36 text-center text-xs font-bold tracking-wide">
        {MESES[mes]} {ano}
      </span>
      <button
        onClick={proximo}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
      {children}
    </p>
  );
}
