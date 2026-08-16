import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Btn, Campo, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  CATEGORIAS_COMPRA,
  UNIDADES,
  uid,
  unidadePadrao,
  type ItemCompra,
  type UnidadeCompra,
} from "@/lib/finance";

const rotuloUnidade: Record<UnidadeCompra, string> = {
  UN: "UN",
  KG: "KG",
  L: "L",
  PCT: "PACOTE",
  CX: "CAIXA",
};

export default function ListaCompras({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const { confirmar, elemento } = useConfirm();
  const [ativaId, setAtivaId] = useState(data.listas[0]?.id ?? "");
  const [novaLista, setNovaLista] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_COMPRA[0] ?? "Outros");
  const [unidade, setUnidade] = useState<UnidadeCompra>(unidadePadrao(CATEGORIAS_COMPRA[0] ?? ""));
  const [quantidade, setQuantidade] = useState(1);

  const lista = data.listas.find((l) => l.id === ativaId) ?? data.listas[0];

  const atualizarItens = (fn: (itens: ItemCompra[]) => ItemCompra[]) =>
    setData((d) => ({
      ...d,
      listas: d.listas.map((l) => (l.id === lista?.id ? { ...l, itens: fn(l.itens) } : l)),
    }));

  const adicionar = () => {
    if (!nome.trim() || !lista) return;
    atualizarItens((itens) => [
      ...itens,
      { id: uid(), nome, categoria, quantidade, unidade, preco: null, comprado: false },
    ]);
    setNome("");
    setQuantidade(1);
  };

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Organize suas compras por lista">Lista de Compras</Titulo>}

      <Panel titulo="Minhas listas" className="mb-4">
        <div className="flex flex-wrap gap-2">
          {data.listas.map((l) => (
            <span
              key={l.id}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                l.id === lista?.id ? "bg-primary text-primary-foreground" : "bg-surface"
              }`}
            >
              <button onClick={() => setAtivaId(l.id)}>{l.nome}</button>
              <button
                onClick={() =>
                  confirmar(`Excluir a lista "${l.nome}"?`, () =>
                    setData((d) => ({ ...d, listas: d.listas.filter((x) => x.id !== l.id) })),
                  )
                }
                aria-label="Excluir lista"
              >
                <Trash2 size={13} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="field sm:max-w-xs"
            placeholder="Nome da nova lista"
            value={novaLista}
            onChange={(e) => setNovaLista(e.target.value)}
          />
          <Btn
            onClick={() => {
              if (!novaLista.trim()) return;
              const nova = { id: uid(), nome: novaLista, itens: [] };
              setData((d) => ({ ...d, listas: [...d.listas, nova] }));
              setAtivaId(nova.id);
              setNovaLista("");
            }}
          >
            <Plus size={15} /> Criar lista
          </Btn>
        </div>
      </Panel>

      <Panel titulo="Adicionar item" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Item">
            <input
              className="field"
              value={nome}
              placeholder="Ex.: Banana"
              onChange={(e) => setNome(e.target.value)}
            />
          </Campo>
          <Campo label="Categoria">
            <select
              className="field"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setUnidade(unidadePadrao(e.target.value));
              }}
            >
              {CATEGORIAS_COMPRA.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Quantidade">
            <div className="flex items-center gap-2">
              <Btn variant="soft" onClick={() => setQuantidade((q) => Math.max(0, +(q - 1).toFixed(2)))}>
                <Minus size={14} />
              </Btn>
              <input
                className="field num text-center"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value.replace(",", ".")) || 0)}
              />
              <Btn variant="soft" onClick={() => setQuantidade((q) => +(q + 1).toFixed(2))}>
                <Plus size={14} />
              </Btn>
            </div>
          </Campo>
          <Campo label="Unidade">
            <div className="flex flex-wrap gap-1.5">
              {UNIDADES.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnidade(u)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                    u === unidade ? "bg-primary text-primary-foreground" : "bg-surface"
                  }`}
                >
                  {rotuloUnidade[u]}
                </button>
              ))}
            </div>
          </Campo>
        </div>
        <div className="mt-3 flex justify-end">
          <Btn onClick={adicionar}>
            <Plus size={15} /> Adicionar item
          </Btn>
        </div>
      </Panel>

      <Panel titulo={lista ? `${lista.nome} (${lista.itens.length})` : "Sem lista"}>
        {!lista || lista.itens.length === 0 ? (
          <Vazio>Nenhum item na lista</Vazio>
        ) : (
          <ul className="space-y-2">
            {lista.itens.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
              >
                <label className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={i.comprado}
                    onChange={() =>
                      atualizarItens((itens) =>
                        itens.map((x) => (x.id === i.id ? { ...x, comprado: !x.comprado } : x)),
                      )
                    }
                    className="size-5 accent-[var(--color-primary)]"
                  />
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-xs font-bold ${i.comprado ? "text-muted-foreground line-through" : ""}`}
                    >
                      {i.nome}
                    </span>
                    <span className="num text-[10px] font-semibold text-muted-foreground">
                      {i.categoria} · {i.quantidade ?? 1} {rotuloUnidade[i.unidade]}
                    </span>
                  </span>
                </label>
                <button
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    confirmar(`Excluir "${i.nome}"?`, () =>
                      atualizarItens((itens) => itens.filter((x) => x.id !== i.id)),
                    )
                  }
                  aria-label="Excluir item"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {elemento}
    </div>
  );
}
