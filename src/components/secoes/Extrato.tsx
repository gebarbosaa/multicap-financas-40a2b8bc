import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  chaveMes,
  dataBR,
  fixoAtivo,
  lancamentosDoMes,
  posicaoParcela,
  valorParcela,
  type Lancamento,
} from "@/lib/finance";

interface Item {
  chave: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  forma: string;
  responsavel: string;
  tipo: "Lançamento" | "Fixo" | "Parcelado";
  parcela?: string;
  pago?: boolean;
  lancamento?: Lancamento;
}

export default function Extrato() {
  const { data, setData } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const [modal, setModal] = useState<{ aberto: boolean; item?: Lancamento }>({ aberto: false });

  const mk = chaveMes(m.mes, m.ano);
  const diaMax = new Date(m.ano, m.mes + 1, 0).getDate();
  const iso = (dia: number) =>
    `${mk}-${String(Math.min(Math.max(dia || 1, 1), diaMax)).padStart(2, "0")}`;

  const itens: Item[] = [
    ...lancamentosDoMes(data.lancamentos, m.mes, m.ano).map<Item>((l) => ({
      chave: `l:${l.id}`,
      data: l.data,
      descricao: l.descricao,
      valor: l.valor,
      categoria: l.categoria,
      forma: l.formaPagamento,
      responsavel: l.responsavel,
      tipo: "Lançamento",
      lancamento: l,
    })),
    ...data.custosFixos
      .filter((c) => fixoAtivo(c, m.mes))
      .map<Item>((c) => ({
        chave: `${mk}:fixo:${c.id}`,
        data: iso(c.diaVencimento),
        descricao: c.descricao,
        valor: c.valor,
        categoria: c.categoria,
        forma: c.formaPagamento,
        responsavel: c.responsavel,
        tipo: "Fixo",
        pago: !!data.pagamentos?.[`${mk}:fixo:${c.id}`],
      })),
    ...data.parcelados
      .map((p) => ({ p, pos: posicaoParcela(p, m.mes, m.ano) }))
      .filter((x) => x.pos > 0)
      .map<Item>(({ p, pos }) => ({
        chave: `${mk}:parc:${p.id}`,
        data: iso(Number(p.dataCompra.split("-")[2])),
        descricao: p.descricao,
        valor: valorParcela(p),
        categoria: p.categoria,
        forma: p.formaPagamento,
        responsavel: p.responsavel,
        tipo: "Parcelado",
        parcela: `Parcela ${pos} de ${p.numeroParcelas}`,
        pago: !!data.pagamentos?.[`${mk}:parc:${p.id}`],
      })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const total = itens.reduce((s, i) => s + i.valor, 0);

  const salvar = (l: Lancamento) => {
    setData((d) => ({
      ...d,
      lancamentos: d.lancamentos.some((x) => x.id === l.id)
        ? d.lancamentos.map((x) => (x.id === l.id ? l : x))
        : [...d.lancamentos, l],
    }));
    setModal({ aberto: false });
  };

  return (
    <div className="animate-section">
      <Titulo sub="Todos os lançamentos do mês, em todas as formas de pagamento">Extrato</Titulo>
      <SeletorMes {...m} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="panel px-4 py-3">
          <p className="label-xs">Total do mês</p>
          <p className="num text-lg font-bold text-primary">{brl(total)}</p>
        </div>
        <Btn onClick={() => setModal({ aberto: true })}>
          <Plus size={15} /> Novo lançamento
        </Btn>
      </div>

      <Panel titulo={`Movimentações (${itens.length})`}>
        {itens.length === 0 ? (
          <Vazio>Nenhuma movimentação neste mês</Vazio>
        ) : (
          <ul className="space-y-2">
            {itens.map((i) => (
              <li
                key={i.chave}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-bold">{i.descricao}</p>
                    <span className="rounded-md bg-card px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {i.forma}
                    </span>
                    {i.parcela && (
                      <span className="rounded-md bg-rosa px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                        {i.parcela}
                      </span>
                    )}
                    {i.pago && (
                      <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                        Pago
                      </span>
                    )}
                  </div>
                  <p className="num text-[10px] font-semibold text-muted-foreground">
                    {dataBR(i.data)} · {i.tipo} · {i.categoria} ·{" "}
                    <EtiquetaResp nome={i.responsavel} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-sm font-bold">{brl(i.valor)}</span>
                  {i.lancamento && (
                    <>
                      <button
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-info"
                        onClick={() =>
                          i.lancamento && setModal({ aberto: true, item: i.lancamento })
                        }
                        aria-label="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() =>
                          confirmar(`Excluir "${i.descricao}"?`, () =>
                            setData((d) => ({
                              ...d,
                              lancamentos: d.lancamentos.filter((x) => x.id !== i.lancamento?.id),
                            })),
                          )
                        }
                        aria-label="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
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
