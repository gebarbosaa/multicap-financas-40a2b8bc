import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Btn, Campo, Modal, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, num, uid, type Investimento } from "@/lib/finance";

export default function Investimentos() {
  const { data, setData } = useStore();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Investimento }>({ aberto: false });
  const [form, setForm] = useState<Investimento>({
    id: uid(),
    nome: "",
    tipo: "Renda Fixa",
    valorAplicado: 0,
    valorAtual: 0,
  });
  const [aplicado, setAplicado] = useState("");
  const [atual, setAtual] = useState("");

  const abrir = (item?: Investimento) => {
    setForm(item ?? { id: uid(), nome: "", tipo: "Renda Fixa", valorAplicado: 0, valorAtual: 0 });
    setAplicado(item ? String(item.valorAplicado) : "");
    setAtual(item ? String(item.valorAtual) : "");
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const salvar = () => {
    if (!form.nome.trim()) return;
    const inv = { ...form, valorAplicado: num(aplicado), valorAtual: num(atual) };
    setData((d) => ({
      ...d,
      investimentos: d.investimentos.some((x) => x.id === inv.id)
        ? d.investimentos.map((x) => (x.id === inv.id ? inv : x))
        : [...d.investimentos, inv],
    }));
    setModal({ aberto: false });
  };

  const totalAplicado = data.investimentos.reduce((s, i) => s + i.valorAplicado, 0);
  const totalAtual = data.investimentos.reduce((s, i) => s + i.valorAtual, 0);
  const lucro = totalAtual - totalAplicado;

  return (
    <div className="animate-section">
      <Titulo sub="Patrimônio investido e rentabilidade">Investimentos</Titulo>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="panel p-4">
          <p className="label-xs">Aplicado</p>
          <p className="num text-lg font-bold">{brl(totalAplicado)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Valor atual</p>
          <p className="num text-lg font-bold">{brl(totalAtual)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Resultado</p>
          <p
            className="num text-lg font-bold"
            style={{ color: lucro >= 0 ? "var(--color-primary)" : "var(--color-destructive)" }}
          >
            {brl(lucro)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Novo investimento
        </Btn>
      </div>

      <Panel titulo={`Carteira (${data.investimentos.length})`}>
        {data.investimentos.length === 0 ? (
          <Vazio>Nenhum investimento cadastrado</Vazio>
        ) : (
          <ul className="space-y-2">
            {data.investimentos.map((i) => {
              const dif = i.valorAtual - i.valorAplicado;
              const pct = i.valorAplicado ? (dif / i.valorAplicado) * 100 : 0;
              return (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{i.nome}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      {i.tipo} · Aplicado {brl(i.valorAplicado)} · Atual {brl(i.valorAtual)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="num text-sm font-bold"
                      style={{
                        color: dif >= 0 ? "var(--color-primary)" : "var(--color-destructive)",
                      }}
                    >
                      {brl(dif)} ({pct.toFixed(1)}%)
                    </span>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-info"
                      onClick={() => abrir(i)}
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirmar(`Excluir "${i.nome}"?`, () =>
                          setData((d) => ({
                            ...d,
                            investimentos: d.investimentos.filter((x) => x.id !== i.id),
                          })),
                        )
                      }
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar investimento" : "Novo investimento"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Nome">
            <input
              className="field"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <Campo label="Tipo">
            <input
              className="field"
              value={form.tipo}
              placeholder="Ex.: CDB, Ações, Tesouro"
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            />
          </Campo>
          <Campo label="Valor aplicado (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={aplicado}
              onChange={(e) => setAplicado(e.target.value)}
            />
          </Campo>
          <Campo label="Valor atual (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
            />
          </Campo>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Btn variant="soft" onClick={() => setModal({ aberto: false })}>
              Cancelar
            </Btn>
            <Btn onClick={salvar}>Salvar</Btn>
          </div>
        </div>
      </Modal>
      {elemento}
    </div>
  );
}
