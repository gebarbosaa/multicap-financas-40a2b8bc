import { useState } from "react";
import { CalendarClock, Pencil, Plus, Repeat2, Trash2 } from "lucide-react";
import { rotuloResp, useResponsaveis, EtiquetaResp } from "@/components/LancamentoForm";
import { Btn, Campo, Modal, Panel, Titulo, Vazio, useConfirm } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  MESES,
  brl,
  custoAnualAssinatura,
  listaAssinaturas,
  num,
  totaisAssinaturas,
  uid,
  type CustoFixo,
} from "@/lib/finance";

type Periodicidade = "mensal" | "anual";

const periodicidadeDe = (c: CustoFixo): Periodicidade =>
  c.mesesAtivos.length <= 2 ? "anual" : "mensal";

export default function Assinaturas() {
  const { data, setData } = useStore();
  const resps = useResponsaveis();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: CustoFixo }>({ aberto: false });

  const assinaturas = listaAssinaturas(data);
  const { mensal, anual } = totaisAssinaturas(data);
  const mesAtual = new Date().getMonth();

  const novo = (): CustoFixo => ({
    id: uid(),
    descricao: "",
    valor: 0,
    categoria: data.config.categorias[0] ?? "Lazer",
    formaPagamento: data.config.formasPagamento[0]?.nome ?? "Cartão de Crédito",
    diaVencimento: 5,
    mesesAtivos: Array.from({ length: 12 }, (_, i) => i),
    responsavel: resps[0] ?? "Conjunta",
    assinatura: true,
  });

  const [form, setForm] = useState<CustoFixo>(novo());
  const [valorTxt, setValorTxt] = useState("");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");

  const abrir = (item?: CustoFixo) => {
    const base = item ? { ...item } : novo();
    setForm(base);
    setValorTxt(item ? String(item.valor) : "");
    setPeriodicidade(item ? periodicidadeDe(item) : "mensal");
    setModal({ aberto: true, ...(item ? { item } : {}) });
  };

  const mudarPeriodicidade = (p: Periodicidade) => {
    setPeriodicidade(p);
    setForm((f) => ({
      ...f,
      mesesAtivos:
        p === "mensal" ? Array.from({ length: 12 }, (_, i) => i) : [f.mesesAtivos[0] ?? mesAtual],
    }));
  };

  const salvar = () => {
    if (!form.descricao.trim()) return;
    const item: CustoFixo = { ...form, valor: num(valorTxt), assinatura: true };
    setData((d) => ({
      ...d,
      custosFixos: d.custosFixos.some((x) => x.id === item.id)
        ? d.custosFixos.map((x) => (x.id === item.id ? item : x))
        : [...d.custosFixos, item],
    }));
    setModal({ aberto: false });
  };

  return (
    <div className="animate-section">
      <Titulo sub="Serviços recorrentes (streaming, SaaS, academia) e o quanto eles pesam no ano">
        Assinaturas
      </Titulo>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="panel px-4 py-3.5">
          <p className="label-xs">Custo mensal</p>
          <p className="num text-xl font-bold text-primary">{brl(mensal)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">ativas este mês</p>
        </div>
        <div className="panel px-4 py-3.5">
          <p className="label-xs">Custo anual acumulado</p>
          <p className="num text-xl font-bold text-primary">{brl(anual)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
            {assinaturas.length} {assinaturas.length === 1 ? "assinatura" : "assinaturas"}
          </p>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Btn onClick={() => abrir()}>
          <Plus size={15} /> Nova assinatura
        </Btn>
      </div>

      {assinaturas.length === 0 ? (
        <Panel>
          <Vazio>
            Nenhuma assinatura cadastrada ainda. Adicione Netflix, Spotify, academia e outros
            serviços recorrentes pra acompanhar o quanto eles custam no ano.
          </Vazio>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 min-[900px]:grid-cols-3">
          {assinaturas.map((c) => {
            const anualC = custoAnualAssinatura(c);
            const anualItem = periodicidadeDe(c) === "anual";
            return (
              <div key={c.id} className="panel panel-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Repeat2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{c.descricao}</p>
                      <p className="truncate text-[10px] font-semibold text-muted-foreground">
                        {c.categoria} · {c.formaPagamento}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      className="p-1 text-muted-foreground hover:text-info"
                      onClick={() => abrir(c)}
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-1 text-muted-foreground hover:text-destructive"
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 flex items-end justify-between gap-2">
                  <div>
                    <p className="num text-lg font-bold">{brl(c.valor)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {anualItem ? "cobrança anual" : "por mês"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-xs font-bold text-primary">{brl(anualC)}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">no ano</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <CalendarClock size={12} /> Dia {String(c.diaVencimento).padStart(2, "0")}
                  </span>
                  <EtiquetaResp nome={c.responsavel} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar assinatura" : "Nova assinatura"}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Nome do serviço" className="sm:col-span-2">
            <input
              className="field"
              placeholder="Netflix, Spotify, Academia…"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Campo>

          <div className="sm:col-span-2">
            <span className="label-xs">Cobrança</span>
            <div className="flex gap-1.5 rounded-xl bg-surface p-1">
              {(["mensal", "anual"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => mudarPeriodicidade(p)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                    periodicidade === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Campo
            label={periodicidade === "anual" ? "Valor da cobrança anual (R$)" : "Valor mensal (R$)"}
          >
            <input
              className="field num"
              inputMode="decimal"
              value={valorTxt}
              onChange={(e) => setValorTxt(e.target.value)}
            />
          </Campo>
          <Campo label="Dia da cobrança">
            <input
              className="field num"
              type="number"
              min={1}
              max={31}
              value={form.diaVencimento}
              onChange={(e) =>
                setForm({
                  ...form,
                  diaVencimento: Math.min(31, Math.max(1, Number(e.target.value))),
                })
              }
            />
          </Campo>

          {periodicidade === "anual" ? (
            <Campo label="Mês da cobrança" className="sm:col-span-2">
              <select
                className="field"
                value={form.mesesAtivos[0] ?? mesAtual}
                onChange={(e) => setForm({ ...form, mesesAtivos: [Number(e.target.value)] })}
              >
                {MESES.map((mes, i) => (
                  <option key={mes} value={i}>
                    {mes}
                  </option>
                ))}
              </select>
            </Campo>
          ) : null}

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
          <Campo label="Forma de pagamento (cartão vinculado)">
            <select
              className="field"
              value={form.formaPagamento}
              onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}
            >
              {data.config.formasPagamento.map((f) => (
                <option key={f.id} value={f.nome}>
                  {f.nome}
                </option>
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
