import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import LancamentoForm, { EtiquetaResp } from "@/components/LancamentoForm";
import {
  Btn,
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
  ehEntrada,
  faturaFechada,
  lancamentosDoMes,
  posicaoParcela,
  valorParcela,
  type Lancamento,
  type Parcelado,
} from "@/lib/finance";

const FILTROS = [
  { id: "todos", nome: "Todos" },
  { id: "entrada", nome: "Entradas" },
  { id: "saida", nome: "Débito/Pix" },
  { id: "cartao", nome: "Cartão" },
] as const;

type FiltroId = (typeof FILTROS)[number]["id"];

/** Item unificado do extrato: um lançamento à vista ou a ocorrência de uma parcela no mês. */
type ItemExtrato =
  | { origem: "lancamento"; id: string; lanc: Lancamento }
  | { origem: "parcela"; id: string; parc: Parcelado; pos: number };

function campos(item: ItemExtrato) {
  if (item.origem === "lancamento") {
    const l = item.lanc;
    return {
      data: l.data,
      descricao: l.descricao,
      categoria: l.categoria,
      formaPagamento: l.formaPagamento,
      responsavel: l.responsavel,
      valor: l.valor,
      entrada: ehEntrada(l),
      cartao: ehCartao(l.formaPagamento),
    };
  }
  const { parc: p, pos } = item;
  return {
    data: p.dataCompra,
    descricao: p.descricao,
    categoria: p.categoria,
    formaPagamento: p.formaPagamento,
    responsavel: p.responsavel,
    valor: valorParcela(p, pos),
    entrada: false,
    // Toda parcela é sempre tratada como "cartão" no extrato (ícone azul), já que
    // representa uma compra parcelada — independente do texto da forma de pagamento.
    cartao: true,
  };
}

export default function Extrato() {
  const { data, setData } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroId>("todos");
  const [selecionado, setSelecionado] = useState<ItemExtrato | null>(null);
  const [form, setForm] = useState<{ aberto: boolean; item?: Lancamento }>({ aberto: false });

  // Lançamentos à vista (entradas + saídas) do mês/ano selecionado
  const doMes = useMemo(
    () => lancamentosDoMes(data.lancamentos, m.mes, m.ano),
    [data.lancamentos, m.mes, m.ano],
  );

  // Ocorrências de parcelas vigentes neste mês (compras parceladas no cartão)
  const parcelasDoMes = useMemo(() => {
    return data.parcelados
      .map((p) => ({ p, pos: posicaoParcela(p, m.mes, m.ano) }))
      .filter((x) => x.pos > 0);
  }, [data.parcelados, m.mes, m.ano]);

  // Lista unificada: lançamentos + parcelas, cada um com seus campos normalizados
  const itens: ItemExtrato[] = useMemo(
    () => [
      ...doMes.map((l): ItemExtrato => ({ origem: "lancamento", id: l.id, lanc: l })),
      ...parcelasDoMes.map(({ p, pos }): ItemExtrato => ({
        origem: "parcela",
        id: `${p.id}:${pos}`,
        parc: p,
        pos,
      })),
    ],
    [doMes, parcelasDoMes],
  );

  const entradas = useMemo(() => doMes.filter(ehEntrada).reduce((s, l) => s + l.valor, 0), [doMes]);
  const saidasDebito = useMemo(
    () =>
      doMes
        .filter((l) => !ehEntrada(l) && !ehCartao(l.formaPagamento))
        .reduce((s, l) => s + l.valor, 0),
    [doMes],
  );
  const saidasCartaoAvista = useMemo(
    () =>
      doMes
        .filter((l) => !ehEntrada(l) && ehCartao(l.formaPagamento))
        .reduce((s, l) => s + l.valor, 0),
    [doMes],
  );
  const saidasParcelas = useMemo(
    () => parcelasDoMes.reduce((s, { p, pos }) => s + valorParcela(p, pos), 0),
    [parcelasDoMes],
  );
  const saidasCartao = saidasCartaoAvista + saidasParcelas;
  // Total do Mês = Entradas − (Saídas/Débitos + Cartões [à vista + parcelas])
  const totalMes = entradas - saidasDebito - saidasCartao;

  const filtrados = useMemo(() => {
    return itens
      .filter((item) => {
        const c = campos(item);
        const bateBusca =
          c.descricao.toLowerCase().includes(busca.toLowerCase()) ||
          c.categoria.toLowerCase().includes(busca.toLowerCase());
        const bateFiltro =
          filtro === "todos" ||
          (filtro === "entrada" && c.entrada) ||
          (filtro === "saida" && !c.entrada && !c.cartao) ||
          (filtro === "cartao" && !c.entrada && c.cartao);
        return bateBusca && bateFiltro;
      })
      .sort((a, b) => {
        const da = campos(a).data;
        const db = campos(b).data;
        return da < db ? 1 : da > db ? -1 : 0;
      });
  }, [itens, busca, filtro]);

  function salvar(l: Lancamento) {
    setData((d) => ({
      ...d,
      lancamentos: d.lancamentos.some((x) => x.id === l.id)
        ? d.lancamentos.map((x) => (x.id === l.id ? l : x))
        : [...d.lancamentos, l],
    }));
    setForm({ aberto: false });
  }

  function excluir(l: Lancamento) {
    confirmar(`Excluir "${l.descricao}"?`, () => {
      setData((d) => ({ ...d, lancamentos: d.lancamentos.filter((x) => x.id !== l.id) }));
      setSelecionado((atual) =>
        atual?.origem === "lancamento" && atual.lanc.id === l.id ? null : atual,
      );
    });
  }

  // Regra de trava: depois do fechamento da fatura, lançamentos daquele cartão
  // ficam bloqueados para edição — a menos que a fatura tenha sido reaberta.
  function bloqueado(item: ItemExtrato) {
    const c = campos(item);
    return c.cartao && !c.entrada && faturaFechada(data, m.mes, m.ano, c.formaPagamento);
  }

  return (
    <div className="animate-section">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <Titulo sub="Todos os lançamentos do mês, em todas as formas de pagamento — incluindo parcelas do cartão">
          Extrato
        </Titulo>
        <Btn onClick={() => setForm({ aberto: true })}>
          <Plus size={15} /> Novo lançamento
        </Btn>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SeletorMes {...m} />
        <div className="panel px-4 py-2">
          <p className="label-xs mb-0.5">Total do mês</p>
          <p
            className={`num text-xl font-bold ${totalMes >= 0 ? "text-primary" : "text-destructive"}`}
          >
            {totalMes < 0 ? "− " : ""}
            {brl(Math.abs(totalMes))}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="label-xs">Entradas</p>
          <p className="num text-lg font-bold text-primary">{brl(entradas)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Saídas · Débito/Pix</p>
          <p className="num text-lg font-bold text-destructive">{brl(saidasDebito)}</p>
        </div>
        <div className="panel p-4">
          <p className="label-xs">Saídas · Cartão (à vista + parcelas)</p>
          <p className="num text-lg font-bold text-info">{brl(saidasCartao)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="field pl-8"
            placeholder="Buscar por descrição ou categoria"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-card p-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                filtro === f.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.nome}
            </button>
          ))}
        </div>
      </div>

      <Panel titulo={`Movimentações (${filtrados.length})`}>
        {filtrados.length === 0 ? (
          <Vazio>Nenhum lançamento encontrado neste mês</Vazio>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((item) => {
              const c = campos(item);
              const Icone = c.entrada ? ArrowUpRight : c.cartao ? CreditCard : ArrowDownLeft;
              const cor = c.entrada ? "text-primary" : c.cartao ? "text-info" : "text-destructive";
              const trava = bloqueado(item);
              const parcela = item.origem === "parcela" ? item : null;

              return (
                <li
                  key={item.id}
                  onClick={() => setSelecionado(item)}
                  className="panel-hover flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-card ${cor}`}
                    >
                      <Icone size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold">{c.descricao}</p>
                        {trava && (
                          <span className="flex items-center gap-1 rounded-md bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                            <Lock size={9} /> Fatura fechada
                          </span>
                        )}
                      </div>
                      <p className="num truncate text-[10px] font-semibold text-muted-foreground">
                        {dataBR(c.data)} · {c.categoria} · {c.formaPagamento} ·{" "}
                        <EtiquetaResp nome={c.responsavel} />
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="text-right">
                      <span className={`num text-sm font-bold ${cor}`}>{brl(c.valor)}</span>
                      {parcela && (
                        <p className="num text-[10px] font-bold text-info">
                          {parcela.pos}/{parcela.parc.numeroParcelas}x de {brl(c.valor)}
                        </p>
                      )}
                    </div>
                    {item.origem === "lancamento" ? (
                      <>
                        <button
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-info disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({ aberto: true, item: item.lanc });
                          }}
                          disabled={trava}
                          title={
                            trava ? "Fatura fechada — reabra em Faturas para editar" : "Editar"
                          }
                          aria-label="Editar lançamento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            excluir(item.lanc);
                          }}
                          disabled={trava}
                          title={
                            trava ? "Fatura fechada — reabra em Faturas para excluir" : "Excluir"
                          }
                          aria-label="Excluir lançamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <span
                        className="rounded-lg p-1.5 text-muted-foreground/50"
                        title="Parcela — edite em Finanças › Parcelamentos"
                      >
                        <CreditCard size={14} />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Modal de detalhes */}
      <Modal
        aberto={!!selecionado}
        onClose={() => setSelecionado(null)}
        titulo="Detalhes do lançamento"
        largura="max-w-sm"
      >
        {selecionado &&
          (() => {
            const c = campos(selecionado);
            const parcela = selecionado.origem === "parcela" ? selecionado : null;
            return (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Descrição</span>
                  <span className="font-bold">{c.descricao}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Data</span>
                  <span className="num">{dataBR(c.data)}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Categoria</span>
                  <span className="font-bold">{c.categoria}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Responsável</span>
                  <EtiquetaResp nome={c.responsavel} />
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Forma de pagamento</span>
                  <span>{c.formaPagamento}</span>
                </div>

                {parcela && (
                  <>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Parcelas</span>
                      <span className="num font-bold text-info">
                        {parcela.pos}/{parcela.parc.numeroParcelas}x
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Valor total da compra</span>
                      <span className="num font-bold text-info">
                        {brl(parcela.parc.valorTotal)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span>{c.entrada ? "Valor recebido" : "Valor registrado"}</span>
                  <span className={`num ${c.entrada ? "text-primary" : "text-destructive"}`}>
                    {brl(c.valor)}
                  </span>
                </div>

                {parcela ? (
                  <p className="mt-1 rounded-lg bg-surface px-3 py-2 text-[10px] font-bold text-muted-foreground">
                    Parcelamento — para editar ou excluir, vá em Finanças › Parcelamentos.
                  </p>
                ) : bloqueado(selecionado) ? (
                  <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-[10px] font-bold text-destructive">
                    <Lock size={12} /> Fatura fechada — reabra em Faturas para editar ou excluir
                  </p>
                ) : (
                  <div className="flex gap-2 pt-3">
                    <Btn
                      variant="soft"
                      className="flex-1"
                      onClick={() => {
                        if (selecionado.origem === "lancamento") {
                          setForm({ aberto: true, item: selecionado.lanc });
                        }
                        setSelecionado(null);
                      }}
                    >
                      <Pencil size={14} /> Editar
                    </Btn>
                    <Btn
                      variant="danger"
                      className="flex-1"
                      onClick={() => {
                        if (selecionado.origem === "lancamento") excluir(selecionado.lanc);
                      }}
                    >
                      <Trash2 size={14} /> Excluir
                    </Btn>
                  </div>
                )}
              </div>
            );
          })()}
      </Modal>

      {/* Modal de novo lançamento / edição */}
      <Modal
        aberto={form.aberto}
        onClose={() => setForm({ aberto: false })}
        titulo={form.item ? "Editar lançamento" : "Novo lançamento"}
      >
        <LancamentoForm
          key={form.item?.id ?? "novo"}
          inicial={form.item}
          onSalvar={salvar}
          onCancelar={() => setForm({ aberto: false })}
        />
      </Modal>

      {elemento}
    </div>
  );
}
