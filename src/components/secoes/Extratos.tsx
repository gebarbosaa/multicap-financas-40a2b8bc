import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { formatCurrency } from '../../lib/finance';
import { Trash2, ArrowUpRight, ArrowDownLeft, FileSpreadsheet } from 'lucide-react';

export function Extratos() {
  const [extratos, setExtratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarExtratos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    // Buscando lançamentos ou faturas/registros para consolidar o extrato
    const { data, error } = await supabase
      .from('faturas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExtratos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarExtratos();
  }, []);

  const excluirRegistro = async (id: string) => {
    await supabase.from('faturas').delete().eq('id', id);
    carregarExtratos();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Extrato Consolidado</h2>
          <p className="text-sm text-gray-400 mt-1">Histórico completo de lançamentos e movimentações.</p>
        </div>
      </div>

      {/* Tabela de Extrato */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-400 bg-gray-950/50">
              <th className="p-4">Tipo</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Data</th>
              <th className="p-4">Valor</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">Carregando extrato...</td>
              </tr>
            ) : extratos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">Nenhum registro encontrado no extrato.</td>
              </tr>
            ) : (
              extratos.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/50">
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                      Lançamento
                    </span>
                  </td>
                  <td className="p-4 font-medium text-white">{item.descricao}</td>
                  <td className="p-4 text-gray-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 text-white font-medium">
                    {formatCurrency(item.valor)}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => excluirRegistro(item.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="Excluir registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
