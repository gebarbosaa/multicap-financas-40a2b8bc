import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Btn, Panel, SeletorMes, Titulo, Vazio, useConfirm, useMes } from "@/components/ui-kit";
import { EtiquetaResp } from "@/components/LancamentoForm";
import { useStore } from "@/lib/store";
import {
  brl,
  chaveFatura,
  dataBR,
  ehCartao,
  faturaFechada,
  faturaFechadaPorData,
  fechamentoDoMes,
  fixoAtivo,
  lancamentosDoMes,
  MESES,
  posicaoParcela,
  valorParcela,
} from "@/lib/finance";

export default function Faturas({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const cartoes = data.config.formasPagamento.filter(ehCartao);
  const [forma, setForma] = useState(cartoes[0] ?? "Cartão de Crédito");

  const aVista = lancamentosDoMes(data.lancamentos, m.mes, m.ano).filter(
    (l) => l.formaPagamento === forma,
  );
  const parcelas = data.parcelados
    .map((p) => ({ p, pos: posicaoParcela(p, m.mes, m.ano) }))
    .filter((x) => x.pos > 0 && x.p.formaPagamento === forma);
  const fixos = data.custosFixos.filter((c) => fixoAtivo(c, m.mes) && c.formaPagamento === forma);

  const total =
    aVista.reduce((s, l) => s + l.valor, 0) +
    parcelas.reduce((s, x) => s + valorParcela(x.p, x.pos), 0) +
    fixos.reduce((s, c) => s + c.valor, 0);

  const fechamento = fechamentoDoMes(data, m.mes, m.ano);
  const chave = chaveFatura(m.mes, m.ano, forma);
  const fechadaPorData = faturaFechadaPorData(data, m.mes, m.ano);
  const fechada = faturaFechada(data, m.mes, m.ano, forma);

  const reabrir = () =>
    confirmar(
      `Reabrir a fatura de ${MESES[m.mes]} para "${forma}"? Os lançamentos deste ciclo poderão ser editados novamente até você fechá-la de novo.`,
      () =>
        setData((d) => ({
          ...d,
          faturasReabertas: [...(d.faturasReabertas ?? []), chave],
        })),
    );

  const fecharDeNovo = () =>
    setData((d) => ({
      ...d,
      faturasReabertas: (d.faturasReabertas ?? []).filter((x) => x !== chave),
    }));

  return (
    <div className="animate-section">
      {!embutido && (
        <Titulo
          sub={`Somente cartão de crédito · fechamento no dia ${String(fechamento).padStart(2, "0")}`}
        >
          Cartão de Crédito
        </Titulo>
      )}
      <SeletorMes {...m} />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="panel p-4">
          <p className="label-xs">Cartão de crédito</p>
          <select className="field" value={forma} onChange={(e) => setForma(e.target.value)}>
            {cartoes.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Total da fatura</p>
          <p className="num text-2xl font-bold text-primary">{brl(total)}</p>
        </div>
      </div>

      {fechadaPorData && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          {fechada ? (
            <>
              <p className="flex items-center gap-2 text-[11px] font-bold text-destructive">
                <Lock size={14} /> Fatura fechada — lançamentos deste ciclo estão bloqueados para
                edição
              </p>
              <Btn variant="soft" onClick={reabrir}>
                Reabrir fatura
              </Btn>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[11px] font-bold text-primary">
                <LockOpen size={14} /> Fatura reaberta manualmente — edição liberada
              </p>
              <Btn variant="soft" onClick={fecharDeNovo}>
                Fechar novamente
              </Btn>
            </>
          )}
        </div>
      )}

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
                      Parcela {pos}/{p.numeroParcelas} · {p.categoria} ·{" "}
                      <EtiquetaResp nome={p.responsavel} />
                    </p>
                  </div>
                  <span className="num text-xs font-bold">{brl(valorParcela(p, pos))}</span>
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
      {elemento}
    </div>
  );
}
