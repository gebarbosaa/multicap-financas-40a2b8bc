import { Panel, SeletorMes, Titulo, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, chaveMes, num, porCategoria, tetoEfetivo } from "@/lib/finance";

export default function Orcamento({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const m = useMes();
  const chave = chaveMes(m.mes, m.ano);
  const tetos = data.tetos[chave] ?? {};
  const gastos = porCategoria(data, m.mes, m.ano);

  const definir = (cat: string, valor: string) =>
    setData((d) => ({
      ...d,
      tetos: { ...d.tetos, [chave]: { ...(d.tetos[chave] ?? {}), [cat]: num(valor) } },
    }));

  const alternarRollover = (cat: string) =>
    setData((d) => {
      const atual = d.config.categoriasRollover ?? [];
      const nova = atual.includes(cat) ? atual.filter((c) => c !== cat) : [...atual, cat];
      return { ...d, config: { ...d.config, categoriasRollover: nova } };
    });

  const totalTeto = data.config.categorias.reduce(
    (s, c) => s + tetoEfetivo(data, c, m.mes, m.ano),
    0,
  );
  const totalGasto = data.config.categorias.reduce((s, c) => s + (gastos[c] ?? 0), 0);

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Tetos de gasto por categoria">Orçamento Mensal</Titulo>}
      <SeletorMes {...m} />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="panel p-4">
          <p className="label-xs">Teto total</p>
          <p className="num text-lg font-bold">{brl(totalTeto)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Gasto total</p>
          <p
            className="num text-lg font-bold"
            style={{
              color:
                totalGasto > totalTeto && totalTeto > 0
                  ? "var(--color-destructive)"
                  : "var(--color-primary)",
            }}
          >
            {brl(totalGasto)}
          </p>
        </div>
      </div>

      <Panel titulo="Categorias">
        <ul className="space-y-4">
          {data.config.categorias.map((cat) => {
            const tetoBase = tetos[cat] ?? 0;
            const rollover = data.config.categoriasRollover?.includes(cat) ?? false;
            const tetoEf = tetoEfetivo(data, cat, m.mes, m.ano);
            const sobraAnterior = Math.max(0, tetoEf - tetoBase);
            const gasto = gastos[cat] ?? 0;
            const pct = tetoEf > 0 ? (gasto / tetoEf) * 100 : 0;
            const estourou = tetoEf > 0 && gasto > tetoEf;
            return (
              <li key={cat} className="rounded-xl bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="num text-[11px] font-bold text-muted-foreground">
                      {brl(gasto)} / {brl(tetoEf)}
                    </span>
                    <input
                      className="field num w-28"
                      inputMode="decimal"
                      placeholder="Teto"
                      value={tetoBase || ""}
                      onChange={(e) => definir(cat, e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: estourou ? "var(--color-destructive)" : "var(--color-primary)",
                    }}
                  />
                </div>
                {tetoEf > 0 && (
                  <p
                    className="num mt-1 text-[10px] font-bold"
                    style={{
                      color: estourou
                        ? "var(--color-destructive)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {pct.toFixed(0)}% {estourou ? `· Estourou ${brl(gasto - tetoEf)}` : ""}
                  </p>
                )}
                <label className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rollover}
                    onChange={() => alternarRollover(cat)}
                    className="size-3.5 accent-primary"
                  />
                  Acumular saldo não usado para o mês seguinte
                </label>
                {rollover && sobraAnterior > 0 && (
                  <p className="num mt-1 text-[10px] font-bold text-primary">
                    + {brl(sobraAnterior)} de saldo trazido do mês anterior
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
