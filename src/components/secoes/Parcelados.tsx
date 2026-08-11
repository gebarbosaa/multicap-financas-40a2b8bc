import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { rotuloResp, useResponsaveis } from "@/components/LancamentoForm";
import {
  Btn,
  Campo,
  Modal,
  Panel,
  SeletorMes,
  Titulo,
  Vazio,
  useConfirm,
  useMes,
} from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { brl, dataBR, hojeISO, num, posicaoParcela, uid, valorParcela, type Parcelado } from "@/lib/finance";

export default function Parcelados() {
  const { data, setData } = useStore();
  const resps = useResponsaveis();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Parcelado }>({ aberto: false });

  const novo = (): Parcelado => ({
    id: uid(),
    descricao: "",
    dataCompra: hojeISO(),
    valorTotal: 0,
    numeroParcelas: 1,
    categoria: data.config.categorias[0] ?? "Outros",
    formaPagamento: data.config.formasPagamento[0] ?? "Cartão de Crédito",
    responsavel: resps[0] ?? "Conjunta",
  });

  const [form, setForm] = useState<Parcelado>(novo());
  const [totalTxt, setTotalTxt] = useState("");

  const abrir = (item?: Parcelado) => {
    setForm(item ? { ...item } : novo());
    setTotalTxt(item ? String(item.valorTotal) : "");
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const salvar = () => {
    if (!form.descricao.trim()) return;
    const item = {
      ...form,
      valorTotal: num(totalTxt),
      numeroParcelas: Math.max(1, form.numeroParcelas),
    };
    setData((d) => ({
      ...d,
      parcelados: d.parcelados.some((x) => x.id === item.id)
        ? d.parcelados.map((x) => (x.id === item.id ? item : x))
        : [...d.parcelados, item],
    }));
    setModal({ aberto: false });
  };

  const parcelaPreview = num(totalTxt) / Math.max(1, form.numeroParcelas);
  const totalVigente = data.parcelados
    .filter((p) => posicaoParcela(p, m.mes, m.ano) > 0)
    .reduce((s, p) => s + valorParcela(p), 0);

  return (
    <div className="animate-section">
      <Titulo sub="Compras divididas em parcelas">Parcelados</Titulo>
      <SeletorMes {...m} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="panel px-4 py-3">
          <p className="label-xs">Parcelas vigentes no mês</p>
          <p className="num text-lg font-bold text-primary">{brl(totalVigente)}</p>
        </div>
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Novo parcelado
        </Btn>
      </div>

      <Panel titulo={`Cadastrados (${data.parcelados.length})`}>
        {data.parcelados.length === 0 ? (
          <Vazio>Nenhum parcelamento cadastrado</Vazio>
        ) : (
          <ul className="space-y-2">
            {data.parcelados.map((p) => {
              const pos = posicaoParcela(p, m.mes, m.ano);
              const faltam = pos > 0 ? p.numeroParcelas - pos : 0;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{p.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      {dataBR(p.dataCompra)} · {brl(p.valorTotal)} em {p.numeroParcelas}x ·{" "}
                      {p.categoria} · {p.formaPagamento} · {rotuloResp(p.responsavel)}
                    </p>
                    <p className="num mt-1 text-[10px] font-bold">
                      {pos > 0 ? (
                        <span className="text-primary">
                          Parcela {pos}/{p.numeroParcelas} · Faltam {faltam}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Não vigente neste mês</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-bold">{brl(valorParcela(p))}</span>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-info"
                      onClick={() => abrir(p)}
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        confirmar(`Excluir "${p.descricao}"?`, () =>
                          setData((d) => ({
                            ...d,
                            parcelados: d.parcelados.filter((x) => x.id !== p.id),
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
        titulo={modal.item ? "Editar parcelado" : "Novo parcelado"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Descrição">
            <input
              className="field"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Campo>
          <Campo label="Data da compra">
            <input
              className="field num"
              type="date"
              value={form.dataCompra}
              onChange={(e) => setForm({ ...form, dataCompra: e.target.value })}
            />
          </Campo>
          <Campo label="Valor total (R$)">
            <input
              className="field num"
              inputMode="decimal"
              value={totalTxt}
              onChange={(e) => setTotalTxt(e.target.value)}
            />
          </Campo>
          <Campo label="Nº de parcelas">
            <input
              className="field num"
              type="number"
              min={1}
              value={form.numeroParcelas}
              onChange={(e) => setForm({ ...form, numeroParcelas: Number(e.target.value) })}
            />
          </Campo>
          <div className="rounded-lg bg-surface px-3 py-2 sm:col-span-2">
            <p className="label-xs mb-0">Valor da parcela</p>
            <p className="num text-sm font-bold text-primary">{brl(parcelaPreview)}</p>
          </div>
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
          <Campo label="Responsável" className="sm:col-span-2">
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
