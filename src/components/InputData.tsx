import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS_SEMANA, MESES, dataBR } from "@/lib/finance";
import { cn } from "@/lib/utils";

const isoParaBR = (iso: string) => (iso ? dataBR(iso) : "");

function brParaISO(txt: string): string | null {
  const m = txt.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dia = Number(d);
  const mes = Number(mo);
  const ano = Number(y);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const dt = new Date(ano, mes - 1, dia);
  if (dt.getDate() !== dia || dt.getMonth() !== mes - 1) return null;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function mascara(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

/** Campo de data com digitação DD/MM/AAAA e calendário popup. */
export default function InputData({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  className?: string;
}) {
  const [txt, setTxt] = useState(isoParaBR(value));
  const [aberto, setAberto] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTxt(isoParaBR(value));
  }, [value]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const base = value ? new Date(`${value}T12:00:00`) : new Date();
  const [mes, setMes] = useState(base.getMonth());
  const [ano, setAno] = useState(base.getFullYear());

  useEffect(() => {
    if (!value) return;
    const d = new Date(`${value}T12:00:00`);
    setMes(d.getMonth());
    setAno(d.getFullYear());
  }, [value]);

  const primeiro = new Date(ano, mes, 1).getDay();
  const dias = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  const ehHoje = (d: number) =>
    hoje.getDate() === d && hoje.getMonth() === mes && hoje.getFullYear() === ano;
  const selDia = value && value.startsWith(`${ano}-${String(mes + 1).padStart(2, "0")}`)
    ? Number(value.split("-")[2])
    : 0;

  const escolher = (d: number) => {
    onChange(`${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    setAberto(false);
  };

  const navegar = (delta: number) => {
    const novo = new Date(ano, mes + delta, 1);
    setMes(novo.getMonth());
    setAno(novo.getFullYear());
  };

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <input
        className="field num pr-9"
        inputMode="numeric"
        placeholder="DD/MM/AAAA"
        value={txt}
        onChange={(e) => {
          const v = mascara(e.target.value);
          setTxt(v);
          const iso = brParaISO(v);
          if (iso) onChange(iso);
        }}
        onBlur={() => setTxt(isoParaBR(value))}
        onFocus={() => setAberto(true)}
      />
      <button
        type="button"
        aria-label="Abrir calendário"
        onClick={() => setAberto((a) => !a)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-primary"
      >
        <CalendarDays size={15} />
      </button>

      {aberto && (
        <div className="panel absolute left-0 z-50 mt-1 w-[248px] p-3 shadow-lift">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() => navegar(-1)}
              className="rounded-md p-1 text-muted-foreground hover:text-primary"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="num text-[10px] font-bold tracking-widest">
              {MESES[mes]?.toUpperCase()} {ano}
            </span>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => navegar(1)}
              className="rounded-md p-1 text-muted-foreground hover:text-primary"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="text-center text-[9px] font-bold text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: primeiro }).map((_, i) => (
              <span key={`v${i}`} />
            ))}
            {Array.from({ length: dias }).map((_, i) => {
              const d = i + 1;
              const sel = selDia === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => escolher(d)}
                  className={cn(
                    "num rounded-md py-1 text-[10px] font-bold transition-colors",
                    sel
                      ? "bg-primary text-primary-foreground"
                      : ehHoje(d)
                        ? "bg-surface text-primary"
                        : "text-foreground hover:bg-surface",
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
