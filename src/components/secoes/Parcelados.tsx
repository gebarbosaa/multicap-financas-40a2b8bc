import { useState } from "react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import InputData from "@/components/InputData";
import { rotuloResp, useResponsaveis, EtiquetaResp } from "@/components/LancamentoForm";
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
import {
  brl,
  dataBR,
  ehCartao,
  faturaFechada,
  hojeISO,
  num,
  posicaoParcela,
  posicaoParcelaBruta,
  uid,
  valorParcela,
  type Parcelado,
} from "@/lib/finance";

export default function Parcelados({ embutido }: { embutido?: boolean } = {}) {
  const { data, setData } = useStore();
  const resps = useResponsaveis();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Parcelado }>({ aberto: false });

  // Quando uma parcela tem mais de uma ocorrência vigente, perguntamos se a
  // edição/exclusão vale só para o mês atual ou para a série inteira.
  const [escolha, setEscolha] = useState<{
    tipo: "editar" | "excluir";
    item: Parcelado;
    pos: number;
  } | null>(null);

  // Edição do valor de uma única parcela (sem mexer na série toda).
  const [modalUnica, setModalUnica] = useState<{ aberto: boolean; item?: Parcelado; pos?: number }>(
    {
      aberto: false,
    },
  );
  const [valorUnicoTxt, setValorUnicoTxt] = useState("");

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

  const excluirSerieCompleta = (id: string) =>
    setData((d) => ({ ...d, parcelados: d.parcelados.filter((x) => x.id !== id) }));

  const excluirParcelaUnica = (item: Parcelado, pos: number) =>
    setData((d) => ({
      ...d,
      parcelados: d.parcelados.map((x) =>
        x.id === item.id ? { ...x, parcelasExcluidas: [...(x.parcelasExcluidas ?? []), pos] } : x,
      ),
    }));

  const abrirEdicaoUnica = (item: Parcelado, pos: number) => {
    setValorUnicoTxt(String(valorParcela(item, pos)));
    setModalUnica({ aberto: true, item, pos });
  };

  const salvarUnica = () => {
    if (!modalUnica.item || !modalUnica.pos) return;
    const { item, pos } = modalUnica;
    setData((d) => ({
      ...d,
      parcelados: d.parcelados.map((x) =>
        x.id === item.id
          ? { ...x, parcelasEditadas: { ...(x.parcelasEditadas ?? {}), [pos]: num(valorUnicoTxt) } }
          : x,
      ),
    }));
    setModalUnica({ aberto: false });
  };

  // Só faz sentido perguntar "esta parcela ou a série?" quando existe mais de
  // uma parcela e a que está na tela é uma ocorrência vigente neste mês.
  const pedirEscolha = (tipo: "editar" | "excluir", item: Parcelado) => {
    const pos = posicaoParcela(item, m.mes, m.ano);
    if (item.numeroParcelas > 1 && pos > 0) {
      setEscolha({ tipo, item, pos });
      return;
    }
    if (tipo === "editar") abrir(item);
    else confirmar(`Excluir "${item.descricao}"?`, () => excluirSerieCompleta(item.id));
  };

  const parcelaPreview = num(totalTxt) / Math.max(1, form.numeroParcelas);
  const totalVigente = data.parcelados.reduce((s, p) => {
    const pos = posicaoParcela(p, m.mes, m.ano);
    return pos > 0 ? s + valorParcela(p, pos) : s;
  }, 0);

  return (
    <div className="animate-section">
      {!embutido && <Titulo sub="Compras divididas em parcelas">Parcelados</Titulo>}
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
            {[...data.parcelados].reverse().map((p) => {
              const posBruta = posicaoParcelaBruta(p, m.mes, m.ano);
              const pos = posicaoParcela(p, m.mes, m.ano);
              const excluidaNesteMes = posBruta > 0 && pos === 0;
              const faltam = pos > 0 ? p.numeroParcelas - pos : 0;
              const valorAjustado = pos > 0 && p.parcelasEditadas?.[pos] !== undefined;
              const bloqueado =
                pos > 0 &&
                ehCartao(p.formaPagamento) &&
                faturaFechada(data, m.mes, m.ano, p.formaPagamento);

              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{p.descricao}</p>
                    <p className="num text-[10px] font-semibold text-muted-foreground">
                      {dataBR(p.dataCompra)} · {brl(p.valorTotal)} em {p.numeroParcelas}x ·{" "}
                      {p.categoria} · {p.formaPagamento} · <EtiquetaResp nome={p.responsavel} />
                    </p>
                    <p className="num mt-1 text-[10px] font-bold">
                      {pos > 0 ? (
                        <span className="text-primary">
                          Parcela {pos}/{p.numeroParcelas} · Faltam {faltam}
                          {valorAjustado ? " · valor ajustado" : ""}
                        </span>
                      ) : excluidaNesteMes ? (
                        <span className="text-muted-foreground">
                          Parcela {posBruta}/{p.numeroParcelas} excluída deste mês
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Não vigente neste mês</span>
                      )}
                      {bloqueado && (
                        <span className="ml-2 inline-flex items-center gap-1 text-destructive">
                          <Lock size={11} /> fatura fechada
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-bold">
                      {brl(valorParcela(p, pos || posBruta))}
                    </span>
                    <button
                      className="p-1.5 text-muted-foreground transition-colors hover:text-info disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground"
                      onClick={() => pedirEscolha("editar", p)}
                      disabled={bloqueado}
                      title={
                        bloqueado
                          ? "Fatura fechada — reabra em Cartão de Crédito para editar"
                          : "Editar"
                      }
                      aria-label="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground"
                      onClick={() => pedirEscolha("excluir", p)}
                      disabled={bloqueado}
                      title={
                        bloqueado
                          ? "Fatura fechada — reabra em Cartão de Crédito para excluir"
                          : "Excluir"
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

      {/* Escolha: esta parcela ou a série inteira? */}
      <Modal
        aberto={!!escolha}
        onClose={() => setEscolha(null)}
        titulo={escolha?.tipo === "editar" ? "Editar parcelamento" : "Excluir parcelamento"}
        largura="max-w-sm"
      >
        {escolha && (
          <>
            <p className="text-xs font-semibold text-muted-foreground">
              "{escolha.item.descricao}" tem {escolha.item.numeroParcelas} parcelas. Essa{" "}
              {escolha.tipo === "editar" ? "edição" : "exclusão"} vale só para a parcela{" "}
              {escolha.pos}/{escolha.item.numeroParcelas} deste mês, ou para a série inteira?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Btn
                variant="soft"
                onClick={() => {
                  if (escolha.tipo === "editar") abrirEdicaoUnica(escolha.item, escolha.pos);
                  else excluirParcelaUnica(escolha.item, escolha.pos);
                  setEscolha(null);
                }}
              >
                Somente esta parcela ({escolha.pos}/{escolha.item.numeroParcelas})
              </Btn>
              <Btn
                onClick={() => {
                  if (escolha.tipo === "editar") {
                    abrir(escolha.item);
                  } else {
                    confirmar(`Excluir toda a série "${escolha.item.descricao}"?`, () =>
                      excluirSerieCompleta(escolha.item.id),
                    );
                  }
                  setEscolha(null);
                }}
              >
                Toda a série ({escolha.item.numeroParcelas} parcelas)
              </Btn>
              <Btn variant="ghost" onClick={() => setEscolha(null)}>
                Cancelar
              </Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Edição do valor de uma parcela isolada */}
      <Modal
        aberto={modalUnica.aberto}
        onClose={() => setModalUnica({ aberto: false })}
        titulo={`Editar parcela ${modalUnica.pos ?? ""}/${modalUnica.item?.numeroParcelas ?? ""}`}
        largura="max-w-sm"
      >
        <Campo label="Valor desta parcela (R$)">
          <input
            className="field num"
            inputMode="decimal"
            value={valorUnicoTxt}
            onChange={(e) => setValorUnicoTxt(e.target.value)}
          />
        </Campo>
        <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
          Vale só para esta ocorrência; as demais parcelas da série continuam com o valor padrão.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="soft" onClick={() => setModalUnica({ aberto: false })}>
            Cancelar
          </Btn>
          <Btn onClick={salvarUnica}>Salvar</Btn>
        </div>
      </Modal>

      <Modal
        aberto={modal.aberto}
        onClose={() => setModal({ aberto: false })}
        titulo={modal.item ? "Editar toda a série" : "Novo parcelado"}
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
            <InputData
              value={form.dataCompra}
              onChange={(iso) => setForm({ ...form, dataCompra: iso })}
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
            <p className="label-xs mb-0">Valor da parcela (padrão da série)</p>
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
