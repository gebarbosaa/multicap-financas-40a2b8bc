import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
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
  banco?: string;
  parcelado?: boolean;
  numeroParcelas?: number;
  valorTotal?: number;
}

const MOCK_LANCAMENTOS: Lancamento[] = [
  {
    id: "1",
    data: "17/08/2026",
    descricao: "MERCADO",
    valor: 136.99,
    tipo: "saida",
    categoria: "MORADIA",
    responsavel: "GEOVANNA",
    formaPagamento: "DÉBITO",
    banco: "NUBANK"
  }
];

export function Extrato() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(MOCK_LANCAMENTOS);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida' | 'credito'>('todos');
  const [itemSelecionado, setItemSelecionado] = useState<Lancamento | null>(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);

  // Estados do formulário de novo lançamento
  const [descricao, setDescricao] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'credito'>('saida');
  const [categoria, setCategoria] = useState('');
  const [responsavel, setResponsavel] = useState('GEOVANNA');
  const [banco, setBanco] = useState('NUBANK');
  const [parcelado, setParcelado] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState(2);

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
      descricao: descricao.toUpperCase(),
      valor: valorNumerico,
      tipo,
      categoria: (categoria || 'GERAL').toUpperCase(),
      responsavel: (responsavel || 'GEOVANNA').toUpperCase(),
      formaPagamento: tipo === 'entrada' ? 'PIX' : tipo === 'saida' ? 'DÉBITO' : 'CARTÃO DE CRÉDITO',
      banco: (banco || 'NUBANK').toUpperCase(),
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
    setNumeroParcelas(2);
  };

  const deletarLancamento = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLancamentos(lancamentos.filter(item => item.id !== id));
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
    <div className="space-y-6 p-6 text-white max-w-6xl mx-auto pb-24">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-wider uppercase">Extrato</h1>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            TODOS OS LANÇAMENTOS DO MÊS, EM TODAS AS FORMAS DE PAGAMENTO
          </p>
        </div>

        <button
          onClick={() => setModalNovoAberto(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Novo lançamento
        </button>
      </div>

      {/* Seletor de Mês e Total */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl text-xs font-bold">
          <button className="hover:text-orange-500"><ChevronLeft className="w-4 h-4" /></button>
          <span>AGOSTO 2026</span>
          <button className="hover:text-orange-500"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 px-5 py-2.5 rounded-xl shadow-inner">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total do Mês</p>
          <p className={`text-2xl font-black font-mono ${totalMes >= 0 ? 'text-orange-500' : 'text-rose-500'}`}>
            R$ {Math.abs(totalMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white text-xs h-10 rounded-xl"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'todos' ? 'bg-orange-500 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('entrada')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🟢 Entradas
          </button>
          <button
            onClick={() => setFiltroTipo('saida')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'saida' ? 'bg-rose-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🔴 Débito
          </button>
          <button
            onClick={() => setFiltroTipo('credito')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filtroTipo === 'credito' ? 'bg-sky-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            🔵 Cartão
          </button>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div>
        <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider mb-3">
          Movimentações ({lancamentosFiltrados.length})
        </h3>

        <div className="space-y-3">
          {lancamentosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-neutral-800">
              <p className="text-neutral-400 text-xs">Nenhum lançamento encontrado.</p>
            </div>
          ) : (
            lancamentosFiltrados.map((item) => (
              <Card
                key={item.id}
                onClick={() => setItemSelecionado(item)}
                className="bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all rounded-2xl"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-sm uppercase text-neutral-100">{item.descricao}</span>
                        {item.banco && (
                          <span className="bg-neutral-800 text-neutral-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {item.banco}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-400 font-medium flex items-center gap-2 mt-1">
                        <span>{item.data}</span>
                        <span>•</span>
                        <span>{item.formaPagamento}</span>
                        <span>•</span>
                        <span>{item.categoria}</span>
                        <span>•</span>
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          ● {item.responsavel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono text-base font-extrabold text-white">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {item.parcelado && item.numeroParcelas && (
                        <p className="text-[11px] text-sky-400 font-mono font-bold">
                          {item.numeroParcelas}x parcelado
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 border-l border-neutral-800 pl-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setItemSelecionado(item); }}
                        className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => deletarLancamento(item.id, e)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!itemSelecionado} onOpenChange={() => setItemSelecionado(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md rounded-2xl">
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
                <span className="text-neutral-400">Banco / Instituição:</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded font-bold">{itemSelecionado.banco}</span>
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

              <div className="flex justify-between pt-2 text-sm font-black">
                <span>Valor Registrado:</span>
                <span className="font-mono text-white">
                  R$ {itemSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Lançamento */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md rounded-2xl">
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
                  className={`py-2.5 text-xs font-bold rounded-xl border ${
                    tipo === 'entrada' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  🟢 Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('saida')}
                  className={`py-2.5 text-xs font-bold rounded-xl border ${
                    tipo === 'saida' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  🔴 Débito/PIX
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('credito')}
                  className={`py-2.5 text-xs font-bold rounded-xl border ${
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
                placeholder="Ex: Salário, Mercado, Luz"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">VALOR</label>
              <Input
                type="text"
                placeholder="R$ 0,00"
                value={valorInput}
                onChange={handleValorChange}
                className="bg-neutral-800 border-neutral-700 text-orange-400 font-mono text-base font-bold h-11 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">BANCO</label>
                <Input
                  placeholder="Ex: Nubank, Itaú"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-10 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 font-bold block mb-1">RESPONSÁVEL</label>
                <Input
                  placeholder="Ex: Geovanna"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 font-bold block mb-1">CATEGORIA</label>
              <Input
                placeholder="Ex: Moradia, Alimentação"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs transition-all uppercase tracking-wider mt-3 shadow-md"
            >
              Salvar Lançamento
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}