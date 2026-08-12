import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Panel, SeletorMes, Titulo, Vazio, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  MESES,
  brl,
  dataBR,
  hojeISO,
  porCategoria,
  corPessoa,
  porResponsavel,
  totaisDoMes,
  vencendoEmBreve,
} from "@/lib/finance";

const CORES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];

function Kpi({ rotulo, valor, cor }: { rotulo: string; valor: number; cor?: string }) {
  return (
    <div className="panel panel-hover p-4">
      <p className="label-xs">{rotulo}</p>
      <p className="num text-xl font-bold" style={cor ? { color: cor } : undefined}>
        {brl(valor)}
      </p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    textTransform: "uppercase" as const,
  },
  formatter: (v: number | string) => brl(Number(v)),
};

export default function VisaoGeral() {
  const { data } = useStore();
  const m = useMes();

  const t = totaisDoMes(data, m.mes, m.ano);
  const cats = porCategoria(data, m.mes, m.ano);
  const resp = porResponsavel(data, m.mes, m.ano);
  const alertas = vencendoEmBreve(data);

  const tendencia = useMemo(
    () =>
      MESES.map((nome, i) => ({
        mes: nome.slice(0, 3).toUpperCase(),
        total: totaisDoMes(data, i, m.ano).total,
      })),
    [data, m.ano],
  );

  const catsOrdenadas = Object.entries(cats)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const tipos = [
    { nome: "FIXO", valor: t.fixos },
    { nome: "PARCELADO", valor: t.parcelados },
    { nome: "À VISTA", valor: t.aVista },
  ].filter((x) => x.valor > 0);

  const hoje = hojeISO();
  const proximosEventos = [...data.agenda]
    .filter((e) => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 4);

  const meta = data.metas[0];
  const nomes = [data.config.pessoaA, data.config.pessoaB, "Conjunta"];

  return (
    <div className="animate-section">
      <Titulo sub="Panorama financeiro do mês">Visão Geral</Titulo>
      <SeletorMes {...m} />

      {alertas.length > 0 && (
        <div className="mb-5 rounded-xl border border-warning/50 bg-warning/15 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold text-warning">
            <AlertTriangle size={15} /> Vencendo em breve
          </p>
          <ul className="space-y-2">
            {alertas.map(({ custo, faltam }) => (
              <li key={custo.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold">{custo.descricao}</span>
                <span className="flex items-center gap-3">
                  <span className="num text-xs font-bold">{brl(custo.valor)}</span>
                  <span className="rounded-md bg-warning px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {faltam === 0 ? "Vence hoje" : faltam === 1 ? "Vence amanhã" : `Em ${faltam} dias`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi rotulo="Total do mês" valor={t.total} cor="var(--color-primary)" />
        <Kpi rotulo="À vista" valor={t.aVista} />
        <Kpi rotulo="Parcelados" valor={t.parcelados} />
        <Kpi rotulo="Custos fixos" valor={t.fixos} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel titulo={`Tendência anual ${m.ano}`} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendencia}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" width={60} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel titulo="Gastos por categoria">
          {catsOrdenadas.length === 0 ? (
            <Vazio>Sem gastos neste mês</Vazio>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catsOrdenadas.map(([nome, valor]) => ({ nome, valor }))}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {catsOrdenadas.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel titulo="Fixo vs Parcelado vs À vista">
          {tipos.length === 0 ? (
            <Vazio>Sem gastos neste mês</Vazio>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tipos} dataKey="valor" nameKey="nome" outerRadius={90}>
                    {tipos.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {nomes.map((n) => (
          <div
            key={n}
            className="rounded-2xl"
            style={{ borderLeft: `6px solid ${corPessoa(n, data.config)}`, overflow: "hidden" }}
          >
            <Kpi rotulo={n === "Conjunta" ? "Ambas" : n} valor={resp[n] ?? 0} />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel titulo="Gastos por responsável">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={nomes.map((n) => ({
                  nome: (n === "Conjunta" ? "Ambas" : n).toUpperCase(),
                  valor: resp[n] ?? 0,
                }))}
              >
                <XAxis dataKey="nome" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" width={60} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-surface)" }} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {nomes.map((n) => (
                    <Cell key={n} fill={corPessoa(n, data.config)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel titulo="Top 5 categorias">
          {catsOrdenadas.length === 0 ? (
            <Vazio>Sem gastos neste mês</Vazio>
          ) : (
            <ul className="space-y-2">
              {catsOrdenadas.slice(0, 5).map(([nome, valor], i) => (
                <li
                  key={nome}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: CORES[i % CORES.length] }}
                    />
                    {nome}
                  </span>
                  <span className="num text-xs font-bold">{brl(valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Próximos eventos">
          {proximosEventos.length === 0 ? (
            <Vazio>Nenhum evento futuro</Vazio>
          ) : (
            <ul className="space-y-2">
              {proximosEventos.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                >
                  <span className="text-xs font-bold">{e.titulo}</span>
                  <span className="num text-[11px] font-bold text-muted-foreground">
                    {dataBR(e.data)} · {e.categoria}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Meta em destaque">
          {!meta ? (
            <Vazio>Cadastre uma meta</Vazio>
          ) : (
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{meta.nome}</span>
                <span className="num">
                  {brl(meta.valorAtual)} / {brl(meta.valorAlvo)}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, meta.valorAlvo ? (meta.valorAtual / meta.valorAlvo) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
