import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────
// 1. TIPAGEM — contrato de como cada lançamento é estruturado
// ─────────────────────────────────────────────────────────
export interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "entrada" | "saida" | "credito";
  categoria: string;
  responsavel: string;
  formaPagamento: string;
  // Opcionais — só existem em compras parceladas no crédito
  parcelado?: boolean;
  numeroParcelas?: number;
  valorTotal?: number;
}

// ─────────────────────────────────────────────────────────
// 2. DADOS INICIAIS (mock)
// ─────────────────────────────────────────────────────────
const MOCK_LANCAMENTOS: Lancamento[] = [
  {
    id: "1",
    data: "17/08/2026",
    descricao: "MERCADO",
    valor: 2334.0,
    tipo: "saida",
    categoria: "MORADIA",
    responsavel: "GEOVANNA",
    formaPagamento: "DÉBITO",
  },
  {
    id: "2",
    data: "17/08/2026",
    descricao: "SALÁRIO / FREELA",
    valor: 3500.0,
    tipo: "entrada",
    categoria: "RENDA",
    responsavel: "BRUNO",
    formaPagamento: "PIX",
  },
  {
    id: "3",
    data: "15/08/2026",
    descricao: "TELEVISÃO 4K LIVING",
    valor: 250.0,
    tipo: "credito",
    categoria: "ELETRÔNICOS",
    responsavel: "BRUNO",
    formaPagamento: "CARTÃO DE CRÉDITO",
    parcelado: true,
    numeroParcelas: 10,
    valorTotal: 2500.0,
  },
];

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "entrada", label: "🟢 Entradas" },
  { id: "saida", label: "🔴 Débito" },
  { id: "credito", label: "🔵 Cartão" },
] as const;

// ─────────────────────────────────────────────────────────
// 3. HELPERS — máscara de moeda estilo caixa eletrônico
// ─────────────────────────────────────────────────────────
function formatarValorMoeda(digitosBrutos: string) {
  const limpo = digitosBrutos.replace(/\D/g, "");
  const numero = limpo ? parseFloat(limpo) / 100 : 0;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paraNumero(txtFormatado: string) {
  const limpo = txtFormatado.replace(/\D/g, "");
  return limpo ? parseFloat(limpo) / 100 : 0;
}

// ─────────────────────────────────────────────────────────
// 4. COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────
export default function Extrato() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(MOCK_LANCAMENTOS);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida" | "credito">("todos");
  const [itemSelecionado, setItemSelecionado] = useState<Lancamento | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Estados do formulário de novo lançamento
  const [descricao, setDescricao] = useState("");
  const [valorTxt, setValorTxt] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida" | "credito">("saida");
  const [categoria, setCategoria] = useState("");
  const [responsavel, setResponsavel] = useState("GEOVANNA");
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(2);

  const valorNumerico = paraNumero(valorTxt);

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValorTxt(formatarValorMoeda(e.target.value));
  }

  function resetarFormulario() {
    setDescricao("");
    setValorTxt("");
    setCategoria("");
    setResponsavel("GEOVANNA");
    setTipo("saida");
    setParcelado(false);
    setNumeroParcelas(2);
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || valorNumerico <= 0) return;

    const ehParcelado = tipo === "credito" && parcelado;

    const novoItem: Lancamento = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString("pt-BR"),
      descricao: descricao.toUpperCase(),
      valor: valorNumerico,
      tipo,
      categoria: (categoria || "GERAL").toUpperCase(),
      responsavel: (responsavel || "BRUNO").toUpperCase(),
      formaPagamento:
        tipo === "entrada"
          ? "PIX RECEBIDO"
          : tipo === "saida"
            ? "DÉBITO / PIX"
            : "CARTÃO DE CRÉDITO",
      parcelado: ehParcelado,
      valorTotal: ehParcelado ? valorNumerico * numeroParcelas : valorNumerico,
      ...(ehParcelado ? { numeroParcelas } : {}),
    };

    setLancamentos((atual) => [novoItem, ...atual]);
    setModalNovoAberto(false);
    resetarFormulario();
  }

  // Filtro + busca
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((item) => {
      const termo = busca.toLowerCase();
      const atendeBusca =
        item.descricao.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo);
      const atendeFiltro = filtroTipo === "todos" || item.tipo === filtroTipo;
      return atendeBusca && atendeFiltro;
    });
  }, [lancamentos, busca, filtroTipo]);

  // Total do mês: entradas somam, saídas e cartão subtraem
  const totalMes = useMemo(
    () =>
      lancamentos.reduce(
        (acc, item) => (item.tipo === "entrada" ? acc + item.valor : acc - item.valor),
        0,
      ),
    [lancamentos],
  );

  const corPorTipo = (t: Lancamento["tipo"]) =>
    t === "entrada" ? "text-emerald-400" : t === "saida" ? "text-rose-400" : "text-sky-400";

  return (
    <div className="space-y-6 p-4 sm:p-6 text-white max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wider uppercase">Extrato</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            Todos os lançamentos do mês, em todas as formas de pagamento
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Novo lançamento
        </button>
      </div>

      {/* Navegação de mês + total */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-bold">
          <button className="hover:text-orange-500" aria-label="Mês anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>AGOSTO 2026</span>
          <button className="hover:text-orange-500" aria-label="Próximo mês">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            Total do mês
          </p>
          <p
            className={`text-xl font-black font-mono ${totalMes >= 0 ? "text-emerald-400" : "text-orange-500"}`}
          >
            {totalMes < 0 ? "− " : ""}
            R$ {Math.abs(totalMes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroTipo(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filtroTipo === f.id
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de movimentações */}
      <div>
        <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">
          Movimentações ({lancamentosFiltrados.length})
        </h3>

        <div className="space-y-2">
          {lancamentosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-xs">Nenhum lançamento encontrado.</p>
            </div>
          ) : (
            lancamentosFiltrados.map((item) => (
              <Card
                key={item.id}
                onClick={() => setItemSelecionado(item)}
                className="bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all"
              >
                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ícone tricolor */}
                    <div
                      className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-bold ${
                        item.tipo === "entrada"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : item.tipo === "saida"
                            ? "bg-rose-500/10 border border-rose-500/20"
                            : "bg-sky-500/10 border border-sky-500/20"
                      }`}
                    >
                      {item.tipo === "entrada" && (
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      )}
                      {item.tipo === "saida" && <ArrowDownLeft className="w-5 h-5 text-rose-400" />}
                      {item.tipo === "credito" && <CreditCard className="w-5 h-5 text-sky-400" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm uppercase text-neutral-100 truncate">
                          {item.descricao}
                        </span>
                        <span className="bg-neutral-800 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {item.formaPagamento}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{item.data}</span>
                        <span>•</span>
                        <span>{item.categoria}</span>
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          ● {item.responsavel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono text-base font-extrabold ${corPorTipo(item.tipo)}`}>
                      {item.tipo === "entrada" ? "+" : "-"} R${" "}
                      {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>

                    {/* Exibição do parcelamento: Nx de R$X */}
                    {item.parcelado && item.numeroParcelas && (
                      <p className="text-[11px] text-sky-400 font-mono font-bold">
                        {item.numeroParcelas}x de R${" "}
                        {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal 1: Detalhamento da transação */}
      <Dialog open={!!itemSelecionado} onOpenChange={() => setItemSelecionado(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase">
              Detalhes da transação
            </DialogTitle>
          </DialogHeader>

          {itemSelecionado && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Descrição:</span>
                <span className="font-bold text-neutral-100">{itemSelecionado.descricao}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Data:</span>
                <span>{itemSelecionado.data}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Categoria:</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded font-bold">
                  {itemSelecionado.categoria}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Responsável:</span>
                <span className="text-orange-400 font-bold">{itemSelecionado.responsavel}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Forma de pagamento:</span>
                <span>{itemSelecionado.formaPagamento}</span>
              </div>

              {itemSelecionado.parcelado && (
                <>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Número de parcelas:</span>
                    <span className="text-sky-400 font-bold">
                      {itemSelecionado.numeroParcelas}x
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Valor total da compra:</span>
                    <span className="font-mono text-sky-400 font-bold">
                      R${" "}
                      {itemSelecionado.valorTotal?.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 text-sm font-black">
                <span>Valor registrado:</span>
                <span className={`font-mono ${corPorTipo(itemSelecionado.tipo)}`}>
                  R$ {itemSelecionado.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Novo lançamento */}
      <Dialog
        open={modalNovoAberto}
        onOpenChange={(aberto) => {
          setModalNovoAberto(aberto);
          if (!aberto) resetarFormulario();
        }}
      >
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase">Novo lançamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                TIPO DE OPERAÇÃO
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo("entrada")}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === "entrada"
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400"
                  }`}
                >
                  🟢 Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("saida")}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === "saida"
                      ? "bg-rose-600 border-rose-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400"
                  }`}
                >
                  🔴 Débito/PIX
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("credito")}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === "credito"
                      ? "bg-sky-600 border-sky-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-400"
                  }`}
                >
                  🔵 Cartão
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">DESCRIÇÃO</label>
              <Input
                placeholder="Ex: Salário, Mercado, Luz"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                VALOR {tipo === "credito" && parcelado ? "(valor da parcela)" : ""}
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={valorTxt}
                onChange={handleValorChange}
                className="bg-neutral-800 border-neutral-700 text-orange-400 font-mono text-base font-bold h-10"
                required
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Digite apenas os números — formato automático de centavos
              </span>
              {tipo === "credito" && parcelado && valorNumerico > 0 && (
                <p className="text-[10px] text-sky-400 font-bold mt-1">
                  Total da compra: R${" "}
                  {(valorNumerico * numeroParcelas).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  em {numeroParcelas}x
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                  CATEGORIA
                </label>
                <Input
                  placeholder="Ex: Moradia / Renda"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                  RESPONSÁVEL
                </label>
                <Input
                  placeholder="Ex: Geovanna / Bruno"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                />
              </div>
            </div>

            {tipo === "credito" && (
              <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/50 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="parcelado"
                    checked={parcelado}
                    onChange={(e) => setParcelado(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-orange-500"
                  />
                  <label
                    htmlFor="parcelado"
                    className="text-xs font-semibold text-neutral-200 cursor-pointer"
                  >
                    Compra parcelada?
                  </label>
                </div>

                {parcelado && (
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Número de parcelas
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={48}
                      value={numeroParcelas}
                      onChange={(e) => setNumeroParcelas(Math.max(2, Number(e.target.value) || 2))}
                      className="field w-full bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs h-9 px-3"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider mt-2 shadow-md"
            >
              Salvar lançamento
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}