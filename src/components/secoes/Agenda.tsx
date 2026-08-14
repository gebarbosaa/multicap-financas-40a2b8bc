import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import InputData from "@/components/InputData";
import { Btn, Campo, Modal, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { dataBR, hojeISO, uid, type EventoAgenda } from "@/lib/finance";

export default function Agenda({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: EventoAgenda }>({ aberto: false });
  const [form, setForm] = useState<EventoAgenda>({
    id: uid(),
    titulo: "",
    data: hojeISO(),
    categoria: data.config.categoriasAgenda[0] ?? "Mercado",
  });

  const abrir = (item?: EventoAgenda) => {
    setForm(
      item ?? {
        id: uid(),
        titulo: "",
        data: hojeISO(),
        categoria: data.config.categoriasAgenda[0] ?? "Mercado",
      },
    );
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const salvar = () => {
    if (!form.titulo.trim()) return;
    setData((d) => ({
      ...d,
      agenda: d.agenda.some((x) => x.id === form.id)
        ? d.agenda.map((x) => (x.id === form.id ? form : x))
        : [...d.agenda, form],
    }));
    setModal({ aberto: false });
  };

  const lista = [...data.agenda].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Compromissos e lembretes">Agenda</Titulo>}

      <div className="mb-4 flex justify-end">
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Novo evento
        </Btn>
      </div>

      <Panel titulo={`Eventos (${lista.length})`}>
        {lista.length === 0 ? (
          <Vazio>Nenhum evento cadastrado</Vazio>
        ) : (
          <ul className="space-y-2">
            {lista.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{e.titulo}</p>
                  <p className="num text-[10px] font-semibold text-muted-foreground">
                    {dataBR(e.data)} · {e.categoria}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 text-muted-foreground hover:text-info"
                    onClick={() => abrir(e)}
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="p-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      confirmar(`Excluir "${e.titulo}"?`, () =>
                        setData((d) => ({ ...d, agenda: d.agenda.filter((x) => x.id !== e.id) })),
                      )
                    }
                    aria-label="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar evento" : "Novo evento"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Título" className="sm:col-span-2">
            <input
              className="field"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </Campo>
          <Campo label="Data">
            <InputData value={form.data} onChange={(iso) => setForm({ ...form, data: iso })} />
          </Campo>

          <Campo label="Categoria">
            <select
              className="field"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {data.config.categoriasAgenda.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
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
