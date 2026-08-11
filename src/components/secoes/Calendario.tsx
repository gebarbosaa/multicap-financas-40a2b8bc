import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import LancamentoForm, { rotuloResp } from "@/components/LancamentoForm";
import { Btn, Modal, Panel, SeletorMes, Titulo, Vazio, useConfirm, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  DIAS_SEMANA,
  brl,
  chaveMes,
  dataBR,
  gastoPorDia,
  hojeISO,
  type Lancamento,
} from "@/lib/finance";

export default function Calendario() {
  const { data, setData } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  const [form, setForm] = useState<{ aberto: boolean; item?: Lancamento }>({ aberto: false });

  const gastos = gastoPorDia(data, m.mes, m.ano);
  const maior = Math.max(1, ...Object.values(gastos));
  const primeiroDiaSemana = new Date(m.ano, m.mes, 1).getDay();
  const diasNoMes = new Date(m.ano, m.mes + 1, 0).getDate();
  const hoje = hojeISO();

  const iso = (dia: number) => `${chaveMes(m.mes, m.ano)}-${String(dia).padStart(2, "0")}`;
  const doDia = diaAberto ? data.lancamentos.filter((l) => l.data === diaAberto) : [];

  const nivel = (v: number) => {
    if (!v) return 0;
    const r = v / maior;
    return r <= 0.25 ? 1 : r <= 0.5 ? 2 : r <= 0.75 ? 3 : 4;
  };
  const fundo = [
    "var(--color-card)",
    "color-mix(in oklab, var(--color-primary) 12%, var(--color-card))",
    "color-mix(in oklab, var(--color-primary) 28%, var(--color-card))",
    "color-mix(in oklab, var(--color-primary) 50%, var(--color-card))",
    "color-mix(in oklab, var(--color-primary) 78%, var(--color-card))",
  ];

  const salvar = (l: Lancamento) => {
    setData((d) => ({
      ...d,
      lancamentos: d.lancamentos.some((x) => x.id === l.id)
        ? d.lancamentos.map((x) => (x.id === l.id ? l : x))
        : [...d.lancamentos, l],
    }));
    setForm({ aberto: false });
  };

  return (
    <div className="animate-section">
      <Titulo sub="Mapa de calor dos gastos por dia">Calendário</Titulo>
      <SeletorMes {...m} />

      <Panel>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="pb-1 text-center text-[10px] font-bold text-muted-foreground">
              {d}
            </div>
          ))}
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`v${i}`} />
          ))}
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1;
            const valor = gastos[dia] ?? 0;
            const n = nivel(valor);
            const ehHoje = iso(dia) === hoje;
            return (
              <button
                key={dia}
                onClick={() => setDiaAberto(iso(dia))}
                style={{ background: fundo[n] }}
                className={`flex min-h-16 flex-col items-start justify-between rounded-xl border p-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft sm:min-h-20 ${
                  ehHoje ? "border-2 border-warning" : "border-border"
                }`}
              >
                <span
                  className={`num text-[11px] font-bold ${n >= 3 ? "text-primary-foreground" : ""}`}
                >
                  {String(dia).padStart(2, "0")}
                </span>
                {valor > 0 && (
                  <span
                    className={`num text-[9px] font-bold leading-tight ${n >= 3 ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {brl(valor)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <Modal
        aberto={!!diaAberto}
        onClose={() => setDiaAberto(null)}
        titulo={`Lançamentos de ${diaAberto ? dataBR(diaAberto) : ""}`}
      >
        {doDia.length === 0 ? (
          <Vazio>Nenhum lançamento neste dia</Vazio>
        ) : (
          <ul className="space-y-2">
            {doDia.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{l.descricao}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {l.categoria} · {rotuloResp(l.responsavel)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-xs font-bold">{brl(l.valor)}</span>
                  <button
                    className="p-1 text-muted-foreground hover:text-info"
                    onClick={() => setForm({ aberto: true, item: l })}
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      confirmar(`Excluir "${l.descricao}"?`, () =>
                        setData((d) => ({
                          ...d,
                          lancamentos: d.lancamentos.filter((x) => x.id !== l.id),
                        })),
                      )
                    }
                    aria-label="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Btn onClick={() => setForm({ aberto: true })}>
            <Plus size={15} /> Adicionar
          </Btn>
        </div>
      </Modal>

      <Modal
        aberto={form.aberto}
        onClose={() => setForm({ aberto: false })}
        titulo={form.item ? "Editar lançamento" : "Novo lançamento"}
      >
        <LancamentoForm
          key={form.item?.id ?? diaAberto ?? "novo"}
          inicial={form.item}
          dataFixa={form.item ? undefined : (diaAberto ?? undefined)}
          onSalvar={salvar}
          onCancelar={() => setForm({ aberto: false })}
        />
      </Modal>
      {elemento}
    </div>
  );
}
