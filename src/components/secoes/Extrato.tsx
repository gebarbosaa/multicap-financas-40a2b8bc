import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Lancamento {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida' | 'credito';
  categoria: string;
  responsavel: string;
  formaPagamento: string;
  parcelado?: boolean;
  numeroParcelas?: number;
  valorTotal?: number;
}

const MOCK_LANCAMENTOS: Lancamento[] = [
  {
    id: "1",
    data: "17/08/2026",
    descricao: "MERCADO",
    valor: 2334.00,
    tipo: "saida",
    categoria: "MORADIA",
    responsavel: "GEOVANNA",
    formaPagamento: "DÉBITO"
  },
  {
    id: "2",
    data: "17/08/2026",
    descricao: "Salário / Freela",
    valor: 3500.00,
    tipo: "entrada",
    categoria: "Renda",
    responsavel: "BRUNO",
    formaPagamento: "PIX"
  },
  {
    id: "3",
    data: "15/08/2026",
    descricao: "Televisão 4K Living",
    valor: 250.00,
    tipo: "credito",
    categoria: "Eletrônicos",
    responsavel: "BRUNO",
    formaPagamento: "Cartão de Crédito",
    parcelado: true,
    numeroParcelas: 10,
    valorTotal: 2500.00
  }
];

export default function ExtratoPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(MOCK_LANCAMENTOS);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida' | 'credito'>('todos');
  const [itemSelecionado, setItemSelecionado] = useState<Lancamento | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Formulário
  const [descricao, setDescricao] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'credito'>('saida');
  const [categoria, setCategoria] = useState('');
  const [responsavel, setResponsavel] = useState('GEOVANNA');
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(1);

  // Formatação de centavos (Estilo Caixa Eletrônico)
  const formatarValorMoeda = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '');
    if (!cleanDigits) return 'R$ 0,00';
    const numberValue = parseFloat(cleanDigits) / 100;
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatarValorMoeda(e.target.value));
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = valorInput.replace(/\D/g, '');
    const valorNumerico = parseFloat(cleanDigits) / 100;
    if (!descricao || valorNumerico <= 0) return;

    const novoItem: Lancamento = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      descricao,
      valor: valorNumerico,
      tipo,
      categoria: categoria || 'GERAL',
      responsavel: responsavel || 'BRUNO',
      formaPagamento: tipo === 'entrada' ? 'PIX' : tipo === 'saida' ? 'DÉBITO' : 'CARTÃO DE CRÉDITO',
      parcelado: tipo === 'credito' && parcelado,
      numeroParcelas: tipo === 'credito' && parcelado ? numeroParcelas : undefined,
      valorTotal: tipo === 'credito' && parcelado ? valorNumerico * numeroParcelas : valorNumerico
    };

    setLancamentos([novoItem, ...lancamentos]);
    setModalNovoAberto(false);
    setDescricao('');
    setValorInput('');
    setCategoria('');
    setParcelado(false);
    setNumeroParcelas(1);
  };

  const lancamentosFiltrados = lancamentos.filter(item => {
    const atendeBusca = item.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                        item.categoria.toLowerCase().includes(busca.toLowerCase());
    const atendeFiltro = filtroTipo === 'todos' || item.tipo === filtroTipo;
    return atendeBusca && atendeFiltro;
  });

  const totalMes = lancamentos.reduce((acc, item) => {
    if (item.tipo === 'entrada') return acc + item.valor;
    return acc - item.valor;
  }, 0);

  return (
    <div className="space-y-6 p-6 text-white max-w-6xl mx-auto">
      {/* Cabeçalho no Padrão do Seu App */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-wider uppercase">Extrato</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            TODOS OS LANÇAMENTOS DO MÊS, EM TODAS AS FORMAS DE PAGAMENTO
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Novo lançamento
        </button>
      </div>

      {/* Navegação de Mês + Total */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-bold">
          <button className="hover:text-orange-500"><ChevronLeft className="w-4 h-4" /></button>
          <span>AGOSTO 2026</span>
          <button className="hover:text-orange-500"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total do Mês</p>
          <p className={`text-xl font-black font-mono ${totalMes >= 0 ? 'text-emerald-400' : 'text-orange-500'}`}>
            R$ {Math.abs(totalMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca Tricolor */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtroTipo === 'todos' ? 'bg-orange-500 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('entrada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtroTipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🟢 Entradas
          </button>
          <button
            onClick={() => setFiltroTipo('saida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtroTipo === 'saida' ? 'bg-rose-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🔴 Débito
          </button>
          <button
            onClick={() => setFiltroTipo('credito')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtroTipo === 'credito' ? 'bg-sky-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🔵 Cartão
          </button>
        </div>
      </div>

      {/* Lista de Movimentações no Estilo Multicap */}
      <div>
        <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">
          Movimentações ({lancamentosFiltrados.length})
        </h3>

        <div className="space-y-2">
          {lancamentosFiltrados.map((item) => (
            <Card
              key={item.id}
              onClick={() => setItemSelecionado(item)}
              className="bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all"
            >
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Ícone Tricolor */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                    item.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    item.tipo === 'saida' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {item.tipo === 'entrada' && <ArrowUpRight className="w-5 h-5" />}
                    {item.tipo === 'saida' && <ArrowDownLeft className="w-5 h-5" />}
                    {item.tipo === 'credito' && <CreditCard className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm uppercase text-neutral-100">{item.descricao}</span>
                      <span className="bg-neutral-800 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {item.formaPagamento}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-2 mt-0.5">
                      <span>{item.data}</span>
                      <span>•</span>
                      <span>LANÇAMENTO</span>
                      <span>•</span>
                      <span>{item.categoria}</span>
                      <span>•</span>
                      <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2 py-0.2 rounded-full text-[10px]">
                        ● {item.responsavel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono text-base font-extrabold ${
                    item.tipo === 'entrada' ? 'text-emerald-400' :
                    item.tipo === 'saida' ? 'text-white' : 'text-sky-400'
                  }`}>
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Parcelas Exibidas estilo $X \times \text{valor}$ */}
                  {item.parcelado && item.numeroParcelas && (
                    <p className="text-[11px] text-sky-400 font-mono font-bold">
                      {item.numeroParcelas}x de R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Detalhamento */}
      <Dialog open={!!itemSelecionado} onOpenChange={() => setItemSelecionado(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase">Detalhes da Transação</DialogTitle>
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
                <span className="bg-neutral-800 px-2 py-0.5 rounded font-bold">{itemSelecionado.categoria}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Responsável:</span>
                <span className="text-orange-400 font-bold">{itemSelecionado.responsavel}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Forma de Pagamento:</span>
                <span>{itemSelecionado.formaPagamento}</span>
              </div>

              {itemSelecionado.parcelado && (
                <>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Número de Parcelas:</span>
                    <span className="text-sky-400 font-bold">{itemSelecionado.numeroParcelas}x</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Valor Total da Compra:</span>
                    <span className="font-mono text-sky-400 font-bold">
                      R$ {itemSelecionado.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 text-sm font-black">
                <span>Valor Registrado:</span>
                <span className="font-mono text-orange-500">
                  R$ {itemSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Novo Lançamento */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black uppercase">Novo Lançamento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSalvar} className="space-y-4 pt-2">
            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">TIPO DE OPERAÇÃO</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === 'entrada' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  🟢 Receita
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('saida')}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === 'saida' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  🔴 Débito/PIX
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('credito')}
                  className={`py-2 text-xs font-bold rounded-lg border ${
                    tipo === 'credito' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  🔵 Cartão
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">DESCRIÇÃO</label>
              <Input
                placeholder="Ex: Mercado, Luz, Salário"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">VALOR (DIGITE APENAS OS NÚMEROS)</label>
              <Input
                type="text"
                placeholder="R$ 0,00"
                value={valorInput}
                onChange={handleValorChange}
                className="bg-neutral-800 border-neutral-700 text-orange-400 font-mono text-base font-bold h-10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">CATEGORIA</label>
                <Input
                  placeholder="Ex: Moradia"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">RESPONSÁVEL</label>
                <Input
                  placeholder="Ex: Geovanna"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                />
              </div>
            </div>

            {tipo === 'credito' && (
              <div className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700/50 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="parcelado"
                    checked={parcelado}
                    onChange={(e) => setParcelado(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-orange-500"
                  />
                  <label htmlFor="parcelado" className="text-xs font-semibold text-neutral-200">
                    Compra Parcelada?
                  </label>
                </div>

                {parcelado && (
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Número de Parcelas</label>
                    <Input
                      type="number"
                      min="2"
                      max="48"
                      value={numeroParcelas}
                      onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                      className="bg-neutral-800 border-neutral-700 text-white text-xs h-9"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-xs transition-all uppercase tracking-wider mt-2 shadow-md"
            >
              Salvar Lançamento
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}