import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Btn, Campo, Modal, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, num, uid, type Meta } from "@/lib/finance";

export default function Metas({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Meta }>({ aberto: false });
  const [nome, setNome] = useState("");
  const [atual, setAtual] = useState("");
  const [alvo, setAlvo] = useState("");
  const [id, setId] = useState(uid());

  const abrir = (item?: Meta) => {
    setId(item?.id ?? uid());
    setNome(item?.nome ?? "");
    setAtual(item ? String(item.valorAtual) : "");
    setAlvo(item ? String(item.valorAlvo) : "");
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const salvar = () => {
    if (!nome.trim()) return;
    const meta: Meta = { id, nome, valorAtual: num(atual), valorAlvo: num(alvo) };
    setData((d) => ({
      ...d,
      metas: d.metas.some((x) => x.id === id)
        ? d.metas.map((x) => (x.id === id ? meta : x))
        : [...d.metas, meta],
    }));
    setModal({ aberto: false });
  };

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Objetivos financeiros do casal">Metas</Titulo>}

      <div className="mb-4 flex justify-end">
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Nova meta
        </Btn>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.metas.length === 0 ? (
          <Panel className="lg:col-span-2">
            <Vazio>Nenhuma meta cadastrada</Vazio>
          </Panel>
        ) : (
          data.metas.map((meta) => {
            const pct = meta.valorAlvo ? (meta.valorAtual / meta.valorAlvo) * 100 : 0;
            return (
              <Panel key={meta.id} className="panel-hover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{meta.nome}</p>
                    <p className="num text-[11px] font-bold text-muted-foreground">
                      {brl(meta.valorAtual)} / {brl(meta.valorAlvo)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-bold text-primary">{pct.toFixed(0)}%</span>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-info"
                      onClick={() => abrir(meta)}
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirmar(`Excluir "${meta.nome}"?`, () =>
                          setData((d) => ({ ...d, metas: d.metas.filter((x) => x.id !== meta.id) })),
                        )
                      }
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </Panel>
            );
          })
        )}
      </div>

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar meta" : "Nova meta"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Nome" className="sm:col-span-2">
            <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <Campo label="Valor atual (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
            />
          </Campo>
          <Campo label="Valor alvo (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={alvo}
              onChange={(e) => setAlvo(e.target.value)}
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
