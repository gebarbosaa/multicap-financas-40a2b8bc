import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import LancamentoForm, { rotuloResp } from "@/components/LancamentoForm";
import { Btn, Modal, Panel, SeletorMes, Titulo, Vazio, useConfirm, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, dataBR, lancamentosDoMes, type Lancamento } from "@/lib/finance";

export default function FluxoMensal() {
  const { data, setData } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Lancamento }>({ aberto: false });

  const lista = lancamentosDoMes(data.lancamentos, m.mes, m.ano).sort((a, b) =>
    b.data.localeCompare(a.data),
  );
  const total = lista.reduce((s, l) => s + l.valor, 0);

  const salvar = (l: Lancamento) => {
    setData((d) => ({
      ...d,
      lancamentos: d.lancamentos.some((x) => x.id === l.id)
        ? d.lancamentos.map((x) => (x.id === l.id ? l : x))
        : [...d.lancamentos, l],
    }));
    setModal({ aberto: false });
  };

  const excluir = (id: string) =>
    setData((d) => ({ ...d, lancamentos: d.lancamentos.filter((x) => x.id !== id) }));

  return (
    <div className="animate-section">
      <Titulo sub="Lançamentos à vista do mês">Fluxo Mensal</Titulo>
      <SeletorMes {...m} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="panel px-4 py-3">
          <p className="label-xs">Total do período</p>
          <p className="num text-lg font-bold text-primary">{brl(total)}</p>
        </div>
        <Btn onClick={() => setModal({ aberto: true })}>
          <Plus size={15} /> Novo lançamento
        </Btn>
      </div>

      <Panel titulo={`Lançamentos (${lista.length})`}>
        {lista.length === 0 ? (
          <Vazio>Nenhum lançamento neste mês</Vazio>
        ) : (
          <ul className="space-y-2">
            {lista.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{l.descricao}</p>
                  <p className="num text-[10px] font-semibold text-muted-foreground">
                    {dataBR(l.data)} · {l.categoria} · {l.formaPagamento} · {rotuloResp(l.responsavel)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-sm font-bold">{brl(l.valor)}</span>
                  <button
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-info"
                    onClick={() => setModal({ aberto: true, item: l })}
                    aria-label="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => confirmar(`Excluir "${l.descricao}"?`, () => excluir(l.id))}
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
        titulo={modal.item ? "Editar lançamento" : "Novo lançamento"}
      >
        <LancamentoForm
          key={modal.item?.id ?? "novo"}
          inicial={modal.item}
          onSalvar={salvar}
          onCancelar={() => setModal({ aberto: false })}
        />
      </Modal>
      {elemento}
    </div>
  );
}
