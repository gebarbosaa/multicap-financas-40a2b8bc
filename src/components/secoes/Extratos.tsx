import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { EtiquetaResp } from "@/components/LancamentoForm";
import { Panel, SeletorMes, Titulo, Vazio, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  brl,
  dataBR,
  fixoAtivo,
  lancamentosDoMes,
  posicaoParcela,
  valorParcela,
} from "@/lib/finance";

type Linha = {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  forma: string;
  responsavel: string;
  valor: number;
  tipo: "entrada" | "saida";
  marcador?: string;
};

export default function Extratos({ embutido }: { embutido?: boolean } = {}) {
  const { data } = useStore();
  const m = useMes();
  const dia = (d: number) =>
    `${m.ano}-${String(m.mes + 1).padStart(2, "0")}-${String(Math.min(Math.max(d, 1), 28)).padStart(2, "0")}`;

  const linhas: Linha[] = [
    ...lancamentosDoMes(data.lancamentos, m.mes, m.ano).map((l) => ({
      id: l.id,
      data: l.data,
      descricao: l.descricao,
      categoria: l.categoria,
      forma: l.formaPagamento,
      responsavel: l.responsavel,
      valor: l.valor,
      tipo: l.tipo ?? ("saida" as const),
    })),
    ...data.custosFixos
      .filter((c) => fixoAtivo(c, m.mes))
      .map((c) => ({
        id: `fixo-${c.id}`,
        data: dia(c.diaVencimento),
        descricao: c.descricao,
        categoria: c.categoria,
        forma: c.formaPagamento,
        responsavel: c.responsavel,
        valor: c.valor,
        tipo: "saida" as const,
        marcador: "Fixo",
      })),
    ...data.parcelados
      .map((p) => ({ p, pos: posicaoParcela(p, m.mes, m.ano) }))
      .filter((x) => x.pos > 0)
      .map(({ p, pos }) => ({
        id: `parc-${p.id}-${pos}`,
        data: p.dataCompra || dia(10),
        descricao: p.descricao,
        categoria: p.categoria,
        forma: p.formaPagamento,
        responsavel: p.responsavel,
        valor: valorParcela(p, pos),
        tipo: "saida" as const,
        marcador: `Parcela ${pos} de ${p.numeroParcelas}`,
      })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const entradas = linhas.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor, 0);
  const saidas = linhas.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor, 0);

  return (
    <div className="animate-section">
      {!embutido && (
        <>
          <Titulo sub="Todos os lançamentos do mês, mais recentes primeiro">Extrato</Titulo>
          <SeletorMes {...m} />
        </>
      )}

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="panel p-4">
          <p className="label-xs">Entradas</p>
          <p className="num text-lg font-bold text-info">{brl(entradas)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Saídas</p>
          <p className="num text-lg font-bold text-primary">{brl(saidas)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Saldo</p>
          <p className="num text-lg font-bold">{brl(entradas - saidas)}</p>
        </div>
      </div>

      <Panel titulo="Movimentações">
        {linhas.length === 0 ? (
          <Vazio>Nenhuma movimentação neste mês</Vazio>
        ) : (
          <ul className="space-y-2">
            {linhas.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                      l.tipo === "entrada"
                        ? "bg-info/15 text-info"
                        : "bg-accent text-accent-foreground"
                    }`}
                    aria-label={l.tipo === "entrada" ? "Entrada" : "Saída"}
                  >
                    {l.tipo === "entrada" ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-bold">{l.descricao}</span>
                  <span className="num text-[10px] font-bold text-muted-foreground">
                    {dataBR(l.data)} · {l.categoria} · {l.forma}
                    {l.marcador ? ` · ${l.marcador}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <EtiquetaResp nome={l.responsavel} />
                  <span
                    className="num text-xs font-bold"
                    style={{ color: l.tipo === "entrada" ? "var(--color-info)" : undefined }}
                  >
                    {l.tipo === "entrada" ? "+" : "-"}
                    {brl(l.valor)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
