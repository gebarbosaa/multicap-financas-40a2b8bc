import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Search, Filter } from 'lucide-react';
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

interface ExtratoFinanceiroProps {
  lancamentos: Lancamento[];
}

export function ExtratoFinanceiro({ lancamentos }: ExtratoFinanceiroProps) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida' | 'credito'>('todos');
  const [itemSelecionado, setItemSelecionado] = useState<Lancamento | null>(null);

  const lancamentosFiltrados = lancamentos.filter(item => {
    const atendeBusca = item.descricao.toLowerCase().includes(busca.toLowerCase());
    const atendeFiltro = filtroTipo === 'todos' || item.tipo === filtroTipo;
    return atendeBusca && atendeFiltro;
  });

  return (
    <div className="space-y-4 p-4 text-white">
      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar lançamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtroTipo === 'todos' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroTipo('entrada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtroTipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            🟢 Entradas
          </button>
          <button
            onClick={() => setFiltroTipo('saida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtroTipo === 'saida' ? 'bg-rose-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            🔴 Saídas / Débito
          </button>
          <button
            onClick={() => setFiltroTipo('credito')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtroTipo === 'credito' ? 'bg-sky-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            🔵 Cartão de Crédito
          </button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2">
        {lancamentosFiltrados.map((item) => (
          <Card
            key={item.id}
            onClick={() => setItemSelecionado(item)}
            className="bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all"
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Ícone Tricolor com indicação visual */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  item.tipo === 'saida' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}>
                  {item.tipo === 'entrada' && <ArrowUpRight className="w-5 h-5" />}
                  {item.tipo === 'saida' && <ArrowDownLeft className="w-5 h-5" />}
                  {item.tipo === 'credito' && <CreditCard className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-neutral-100">{item.descricao}</h4>
                  <p className="text-xs text-neutral-400">{item.data} • {item.categoria}</p>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${
                  item.tipo === 'entrada' ? 'text-emerald-400' : 'text-neutral-200'
                }`}>
                  {item.tipo === 'entrada' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                </span>
                {item.parcelado && (
                  <p className="text-[10px] text-sky-400 font-mono">
                    {item.numeroParcelas}x
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Detalhamento ao Clicar */}
      <Dialog open={!!itemSelecionado} onOpenChange={() => setItemSelecionado(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Detalhamento do Lançamento</DialogTitle>
          </DialogHeader>

          {itemSelecionado && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Descrição:</span>
                <span className="font-semibold">{itemSelecionado.descricao}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Data:</span>
                <span>{itemSelecionado.data}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Categoria:</span>
                <span>{itemSelecionado.categoria}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Forma de Pagamento:</span>
                <span>{itemSelecionado.formaPagamento}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Responsável:</span>
                <span className="text-orange-400 font-medium">{itemSelecionado.responsavel}</span>
              </div>

              {itemSelecionado.parcelado && (
                <>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Nº de Parcelas:</span>
                    <span>{itemSelecionado.numeroParcelas}x</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-2">
                    <span className="text-neutral-400">Valor Total da Compra:</span>
                    <span className="font-mono text-sky-400">
                      R$ {itemSelecionado.valorTotal?.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 text-base font-bold">
                <span>Valor Registrado:</span>
                <span className="font-mono text-orange-500">
                  R$ {itemSelecionado.valor.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}