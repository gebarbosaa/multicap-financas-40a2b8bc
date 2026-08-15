import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Btn, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { UNIDADES, brl, subtotalItem, type ItemCompra, type UnidadeCompra } from "@/lib/finance";

export default function ModoMercado({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const { confirmar, elemento } = useConfirm();
  const [ativaId, setAtivaId] = useState(data.listas[0]?.id ?? "");
  const lista = data.listas.find((l) => l.id === ativaId) ?? data.listas[0];

  const atualizarItens = (fn: (itens: ItemCompra[]) => ItemCompra[]) =>
    setData((d) => ({
      ...d,
      listas: d.listas.map((l) => (l.id === lista?.id ? { ...l, itens: fn(l.itens) } : l)),
    }));

  const patch = (id: string, p: Partial<ItemCompra>) =>
    atualizarItens((itens) => itens.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const total = (lista?.itens ?? []).reduce((s, i) => s + subtotalItem(i), 0);
  const totalComprado = (lista?.itens ?? [])
    .filter((i) => i.comprado)
    .reduce((s, i) => s + subtotalItem(i), 0);

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Modo compras com toque grande e preços">Modo Mercado</Titulo>}

      <div className="mb-4 flex flex-wrap gap-2">
        {data.listas.map((l) => (
          <button
            key={l.id}
            onClick={() => setAtivaId(l.id)}
            className={`rounded-lg px-4 py-2.5 text-xs font-bold transition-colors ${
              l.id === lista?.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
          >
            {l.nome}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="panel p-4">
          <p className="label-xs">Total da lista</p>
          <p className="num text-xl font-bold">{brl(total)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Já no carrinho</p>
          <p className="num text-xl font-bold text-primary">{brl(totalComprado)}</p>
        </div>
      </div>

      <Panel titulo={lista ? lista.nome : "Sem lista"}>
        {!lista || lista.itens.length === 0 ? (
          <Vazio>Nenhum item na lista</Vazio>
        ) : (
          <ul className="space-y-3">
            {lista.itens.map((i) => (
              <li key={i.id} className="rounded-xl bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={i.comprado}
                      onChange={() => patch(i.id, { comprado: !i.comprado })}
                      className="size-7 accent-[var(--color-primary)]"
                    />
                    <span
                      className={`truncate text-sm font-bold ${i.comprado ? "text-muted-foreground line-through" : ""}`}
                    >
                      {i.nome}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-bold text-primary">
                      {brl(subtotalItem(i))}
                    </span>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirmar(`Excluir "${i.nome}"?`, () =>
                          atualizarItens((itens) => itens.filter((x) => x.id !== i.id)),
                        )
                      }
                      aria-label="Excluir item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <span className="label-xs">Quantidade</span>
                    <div className="flex items-center gap-2">
                      <Btn
                        variant="soft"
                        className="px-4 py-3"
                        onClick={() =>
                          patch(i.id, {
                            quantidade: Math.max(0, +((i.quantidade ?? 0) - 1).toFixed(2)),
                          })
                        }
                      >
                        <Minus size={16} />
                      </Btn>
                      <input
                        className="field num text-center text-base"
                        inputMode="decimal"
                        value={i.quantidade ?? ""}
                        onChange={(e) =>
                          patch(i.id, { quantidade: Number(e.target.value.replace(",", ".")) || 0 })
                        }
                      />
                      <Btn
                        variant="soft"
                        className="px-4 py-3"
                        onClick={() =>
                          patch(i.id, { quantidade: +((i.quantidade ?? 0) + 1).toFixed(2) })
                        }
                      >
                        <Plus size={16} />
                      </Btn>
                    </div>
                  </div>
                  <div>
                    <span className="label-xs">
                      {i.unidade === "KG" ? "Preço por KG (R$)" : "Preço unitário (R$)"}
                    </span>
                    <input
                      className="field num text-base"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={i.preco ?? ""}
                      onChange={(e) =>
                        patch(i.id, {
                          preco:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value.replace(",", ".")) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <span className="label-xs">Unidade</span>
                    <div className="flex flex-wrap gap-1.5">
                      {UNIDADES.map((u) => (
                        <button
                          key={u}
                          onClick={() => patch(i.id, { unidade: u as UnidadeCompra })}
                          className={`rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${
                            u === i.unidade
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {elemento}
    </div>
  );
}
