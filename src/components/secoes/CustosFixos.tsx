import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { rotuloResp, useResponsaveis, EtiquetaResp } from "@/components/LancamentoForm";
import { Btn, Campo, Modal, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { MESES, brl, num, uid, type CustoFixo } from "@/lib/finance";

export default function CustosFixos() {
  const { data, setData } = useStore();
  const resps = useResponsaveis();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: CustoFixo }>({ aberto: false });

  const novo = (): CustoFixo => ({
    id: uid(),
    descricao: "",
    valor: 0,
    categoria: data.config.categorias[0] ?? "Outros",
    formaPagamento: data.config.formasPagamento[0] ?? "Débito",
    diaVencimento: 5,
    mesesAtivos: Array.from({ length: 12 }, (_, i) => i),
    responsavel: resps[0] ?? "Conjunta",
  });

  const [form, setForm] = useState<CustoFixo>(novo());
  const [valorTxt, setValorTxt] = useState("");

  const abrir = (item?: CustoFixo) => {
    setForm(item ? { ...item } : novo());
    setValorTxt(item ? String(item.valor) : "");
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const salvar = () => {
    if (!form.descricao.trim()) return;
    const item = { ...form, valor: num(valorTxt) };
    setData((d) => ({
      ...d,
      custosFixos: d.custosFixos.some((x) => x.id === item.id)
        ? d.custosFixos.map((x) => (x.id === item.id ? item : x))
        : [...d.custosFixos, item],
    }));
    setModal({ aberto: false });
  };

  const total = data.custosFixos.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="animate-section">
      <Titulo sub="Despesas recorrentes mensais">Custos Fixos</Titulo>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="panel px-4 py-3">
          <p className="label-xs">Total cadastrado</p>
          <p className="num text-lg font-bold text-primary">{brl(total)}</p>
        </div>
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Novo custo fixo
        </Btn>
      </div>

      <Panel titulo={`Cadastrados (${data.custosFixos.length})`}>
        {data.custosFixos.length === 0 ? (
          <Vazio>Nenhum custo fixo cadastrado</Vazio>
        ) : (
          <ul className="space-y-2">
            {data.custosFixos.map((c) => (
              <li key={c.id} className="rounded-lg bg-surface px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{c.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      Vence dia {String(c.diaVencimento).padStart(2, "0")} · {c.categoria} ·{" "}
                      {c.formaPagamento} · <EtiquetaResp nome={c.responsavel} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-bold">{brl(c.valor)}</span>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-info"
                      onClick={() => abrir(c)}
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirmar(`Excluir "${c.descricao}"?`, () =>
                          setData((d) => ({
                            ...d,
                            custosFixos: d.custosFixos.filter((x) => x.id !== c.id),
                          })),
                        )
                      }
                      aria-label="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {MESES.map((mes, i) => (
                    <span
                      key={mes}
                      className={`num rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        c.mesesAtivos.includes(i)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground"
                      }`}
                    >
                      {mes.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar custo fixo" : "Novo custo fixo"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Descrição">
            <input
              className="field"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Campo>
          <Campo label="Valor (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={valorTxt}
              onChange={(e) => setValorTxt(e.target.value)}
            />
          </Campo>
          <Campo label="Categoria">
            <select
              className="field"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {data.config.categorias.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Forma de pagamento">
            <select
              className="field"
              value={form.formaPagamento}
              onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
            >
              {data.config.formasPagamento.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Dia de vencimento">
            <input
              className="field num"
              type="number"
              min={1}
              max={31}
              value={form.diaVencimento}
              onChange={(e) =>
                setForm({ ...form, diaVencimento: Math.min(31, Math.max(1, Number(e.target.value))) })
              }
            />
          </Campo>
          <Campo label="Responsável">
            <select
              className="field"
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            >
              {resps.map((r) => (
                <option key={r} value={r}>
                  {rotuloResp(r)}
                </option>
              ))}
            </select>
          </Campo>
          <div className="sm:col-span-2">
            <span className="label-xs">Meses ativos</span>
            <div className="flex flex-wrap gap-1.5">
              {MESES.map((mes, i) => {
                const ativo = form.mesesAtivos.includes(i);
                return (
                  <button
                    key={mes}
                    onClick={() =>
                      setForm({
                        ...form,
                        mesesAtivos: ativo
                          ? form.mesesAtivos.filter((x) => x !== i)
                          : [...form.mesesAtivos, i].sort((a, b) => a - b),
                      })
                    }
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                      ativo
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground"
                    }`}
                  >
                    {mes.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
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
