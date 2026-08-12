import { useState } from "react";
import { Panel, SeletorMes, Titulo, Vazio, useMes } from "@/components/ui-kit";
import { rotuloResp, EtiquetaResp } from "@/components/LancamentoForm";
import { useStore } from "@/lib/store";
import {
  brl,
  dataBR,
  fechamentoDoMes,
  fixoAtivo,
  lancamentosDoMes,
  posicaoParcela,
  valorParcela,
} from "@/lib/finance";

export default function Faturas() {
  const { data } = useStore();
  const m = useMes();
  const [forma, setForma] = useState(data.config.formasPagamento[0] ?? "Cartão de Crédito");

  const aVista = lancamentosDoMes(data.lancamentos, m.mes, m.ano).filter(
    (l) => l.formaPagamento === forma,
  );
  const parcelas = data.parcelados
    .map((p) => ({ p, pos: posicaoParcela(p, m.mes, m.ano) }))
    .filter((x) => x.pos > 0 && x.p.formaPagamento === forma);
  const fixos = data.custosFixos.filter((c) => fixoAtivo(c, m.mes) && c.formaPagamento === forma);

  const total =
    aVista.reduce((s, l) => s + l.valor, 0) +
    parcelas.reduce((s, x) => s + valorParcela(x.p), 0) +
    fixos.reduce((s, c) => s + c.valor, 0);

  const fechamento = fechamentoDoMes(data, m.mes, m.ano);

  return (
    <div className="animate-section">
      <Titulo sub={`Fechamento no dia ${String(fechamento).padStart(2, "0")}`}>Faturas</Titulo>
      <SeletorMes {...m} />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="panel p-4">
          <p className="label-xs">Forma de pagamento</p>
          <select className="field" value={forma} onChange={(e) => setForma(e.target.value)}>
            {data.config.formasPagamento.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Total da fatura</p>
          <p className="num text-2xl font-bold text-primary">{brl(total)}</p>
        </div>
      </div>

      <div className="grid gap-4">
        <Panel titulo={`À vista (${aVista.length})`}>
          {aVista.length === 0 ? (
            <Vazio>Nada nesta forma de pagamento</Vazio>
          ) : (
            <ul className="space-y-2">
              {aVista.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{l.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      {dataBR(l.data)} · {l.categoria} · <EtiquetaResp nome={l.responsavel} />
                    </p>
                  </div>
                  <span className="num text-xs font-bold">{brl(l.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo={`Parcelas vigentes (${parcelas.length})`}>
          {parcelas.length === 0 ? (
            <Vazio>Nenhuma parcela neste mês</Vazio>
          ) : (
            <ul className="space-y-2">
              {parcelas.map(({ p, pos }) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{p.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      Parcela {pos}/{p.numeroParcelas} · {p.categoria} · <EtiquetaResp nome={p.responsavel} />
                    </p>
                  </div>
                  <span className="num text-xs font-bold">{brl(valorParcela(p))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo={`Custos fixos (${fixos.length})`}>
          {fixos.length === 0 ? (
            <Vazio>Nenhum custo fixo neste mês</Vazio>
          ) : (
            <ul className="space-y-2">
              {fixos.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{c.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      Vence dia {String(c.diaVencimento).padStart(2, "0")} · {c.categoria} ·{" "}
<EtiquetaResp nome={c.responsavel} />
                    </p>
                  </div>
                  <span className="num text-xs font-bold">{brl(c.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
