import { AlertTriangle, Check } from "lucide-react";
import { EtiquetaResp } from "@/components/LancamentoForm";
import { Panel, SeletorMes, Titulo, Vazio, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, contasDoMes, dataBR, hojeISO, type ContaMes } from "@/lib/finance";

function Linha({
  c,
  pago,
  atrasada,
  alternar,
}: {
  c: ContaMes;
  pago: boolean;
  atrasada: boolean;
  alternar: () => void;
}) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-all ${
        pago ? "bg-surface/60 opacity-60" : atrasada ? "bg-destructive/10" : "bg-surface"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={alternar}
          aria-label={pago ? "Marcar como pendente" : "Marcar como pago"}
          className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            pago
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:border-primary"
          }`}
        >
          {pago && <Check size={13} />}
        </button>
        <div className="min-w-0">
          <p className={`truncate text-xs font-bold ${pago ? "line-through" : ""}`}>{c.nome}</p>
          <p className="num text-[10px] font-semibold text-muted-foreground">
            {c.tipo} · vence {dataBR(c.vencimento)} · {c.detalhe} ·{" "}
            <EtiquetaResp nome={c.responsavel} />
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!pago && atrasada && (
          <span className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-0.5 text-[9px] font-bold text-destructive-foreground">
            <AlertTriangle size={11} /> Vencida
          </span>
        )}
        <span className={`num text-sm font-bold ${pago ? "line-through" : ""}`}>{brl(c.valor)}</span>
      </div>
    </li>
  );
}

export default function ContasAPagar({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const m = useMes();

  const contas = contasDoMes(data, m.mes, m.ano);
  const hoje = hojeISO();
  const pagoDe = (c: ContaMes) => !!data.pagamentos?.[c.chave];

  const pendentes = contas.filter((c) => !pagoDe(c));
  const pagas = contas.filter(pagoDe);
  const totalPendente = pendentes.reduce((s, c) => s + c.valor, 0);
  const totalPago = pagas.reduce((s, c) => s + c.valor, 0);

  const alternar = (chave: string) =>
    setData((d) => ({
      ...d,
      pagamentos: { ...(d.pagamentos ?? {}), [chave]: !(d.pagamentos ?? {})[chave] },
    }));

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Checklist de contas do mês">Contas a Pagar</Titulo>}
      <SeletorMes {...m} />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="label-xs">Pendente</p>
          <p className="num text-xl font-bold text-destructive">{brl(totalPendente)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Já pago</p>
          <p className="num text-xl font-bold text-primary">{brl(totalPago)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Total do mês</p>
          <p className="num text-xl font-bold">{brl(totalPendente + totalPago)}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <Panel titulo={`Pendentes (${pendentes.length})`}>
          {pendentes.length === 0 ? (
            <Vazio>Nenhuma conta pendente neste mês</Vazio>
          ) : (
            <ul className="space-y-2">
              {pendentes.map((c) => (
                <Linha
                  key={c.chave}
                  c={c}
                  pago={false}
                  atrasada={c.vencimento < hoje}
                  alternar={() => alternar(c.chave)}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo={`Pagas (${pagas.length})`}>
          {pagas.length === 0 ? (
            <Vazio>Nenhuma conta paga ainda</Vazio>
          ) : (
            <ul className="space-y-2">
              {pagas.map((c) => (
                <Linha
                  key={c.chave}
                  c={c}
                  pago
                  atrasada={false}
                  alternar={() => alternar(c.chave)}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
