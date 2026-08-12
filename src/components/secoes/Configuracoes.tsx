import { useRef, useState } from "react";
import { Download, LogOut, Plus, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Btn, Campo, Modal, Panel, SeletorMes, Titulo, useConfirm, useMes } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { encerrarSessao } from "@/components/PortaAcesso";
import { chaveMes, dataBR, uid, type AppData, type Lancamento } from "@/lib/finance";

function baixar(nome: string, conteudo: BlobPart, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function Chips({
  titulo,
  itens,
  onAdd,
  onRemove,
}: {
  titulo: string;
  itens: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [txt, setTxt] = useState("");
  return (
    <Panel titulo={titulo}>
      <div className="flex flex-wrap gap-2">
        {itens.map((i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-[11px] font-bold"
          >
            {i}
            <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive">
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="field"
          placeholder="Adicionar"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
        />
        <Btn
          onClick={() => {
            if (!txt.trim()) return;
            onAdd(txt.trim());
            setTxt("");
          }}
        >
          <Plus size={15} />
        </Btn>
      </div>
    </Panel>
  );
}

export default function Configuracoes() {
  const { data, setData, substituirTudo, resetar } = useStore();
  const m = useMes();
  const { confirmar, elemento } = useConfirm();
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const chave = chaveMes(m.mes, m.ano);
  const excecao = data.config.fechamentosPorMes[chave];

  const setConfig = (patch: Partial<AppData["config"]>) =>
    setData((d) => ({ ...d, config: { ...d.config, ...patch } }));

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.lancamentos.map((l) => ({
          Data: dataBR(l.data),
          Descrição: l.descricao,
          Valor: l.valor,
          Categoria: l.categoria,
          "Forma de Pagamento": l.formaPagamento,
          Responsável: l.responsavel,
        })),
      ),
      "Lançamentos",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.custosFixos.map((c) => ({
          Descrição: c.descricao,
          Valor: c.valor,
          Categoria: c.categoria,
          "Forma de Pagamento": c.formaPagamento,
          "Dia Vencimento": c.diaVencimento,
          "Meses Ativos": c.mesesAtivos.map((x) => x + 1).join(", "),
          Responsável: c.responsavel,
        })),
      ),
      "Custos Fixos",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.parcelados.map((p) => ({
          Descrição: p.descricao,
          "Data da Compra": dataBR(p.dataCompra),
          "Valor Total": p.valorTotal,
          Parcelas: p.numeroParcelas,
          "Valor da Parcela": p.numeroParcelas ? p.valorTotal / p.numeroParcelas : 0,
          Categoria: p.categoria,
          "Forma de Pagamento": p.formaPagamento,
          Responsável: p.responsavel,
        })),
      ),
      "Parcelados",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.metas.map((x) => ({ Nome: x.nome, "Valor Atual": x.valorAtual, "Valor Alvo": x.valorAlvo })),
      ),
      "Metas",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        data.investimentos.map((x) => ({
          Nome: x.nome,
          Tipo: x.tipo,
          "Valor Aplicado": x.valorAplicado,
          "Valor Atual": x.valorAtual,
          Resultado: x.valorAtual - x.valorAplicado,
        })),
      ),
      "Investimentos",
    );
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    baixar("multicap.xlsx", out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  };

  const exportarCsv = () => {
    const linhas = [
      "Data;Descrição;Valor;Categoria;Forma de Pagamento;Responsável",
      ...data.lancamentos.map((l) =>
        [l.data, l.descricao, String(l.valor), l.categoria, l.formaPagamento, l.responsavel].join(";"),
      ),
    ];
    baixar("multicap-lancamentos.csv", "\uFEFF" + linhas.join("\n"), "text/csv;charset=utf-8");
  };

  const importarCsv = async (file: File) => {
    const txt = await file.text();
    const linhas = txt.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).slice(1);
    const novos: Lancamento[] = linhas.map((linha) => {
      const c = linha.split(linha.includes(";") ? ";" : ",");
      return {
        id: uid(),
        data: (c[0] ?? "").includes("/")
          ? (c[0] ?? "").split("/").reverse().join("-")
          : (c[0] ?? ""),
        descricao: c[1] ?? "",
        valor: Number(String(c[2] ?? "0").replace(",", ".")) || 0,
        categoria: c[3] ?? "Outros",
        formaPagamento: c[4] ?? "Débito",
        responsavel: c[5] ?? "Conjunta",
      };
    });
    setData((d) => ({ ...d, lancamentos: [...d.lancamentos, ...novos] }));
    setAviso(`${novos.length} lançamentos importados.`);
  };

  return (
    <div className="animate-section">
      <Titulo sub="Preferências, listas e backup">Configurações</Titulo>
      <SeletorMes {...m} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Pessoas">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Pessoa A">
              <input
                className="field"
                value={data.config.pessoaA}
                onChange={(e) => setConfig({ pessoaA: e.target.value })}
              />
            </Campo>
            <Campo label="Pessoa B">
              <input
                className="field"
                value={data.config.pessoaB}
                onChange={(e) => setConfig({ pessoaB: e.target.value })}
              />
            </Campo>
          </div>
        </Panel>

        <Panel titulo="Fechamento de fatura">
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Dia padrão">
              <input
                className="field num"
                type="number"
                min={1}
                max={31}
                value={data.config.diaFechamentoPadrao}
                onChange={(e) =>
                  setConfig({
                    diaFechamentoPadrao: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                  })
                }
              />
            </Campo>
            <Campo label={`Exceção para ${chave}`}>
              <input
                className="field num"
                type="number"
                min={1}
                max={31}
                value={excecao ?? ""}
                placeholder="Padrão"
                onChange={(e) => {
                  const v = e.target.value;
                  setData((d) => {
                    const mapa = { ...d.config.fechamentosPorMes };
                    if (!v) delete mapa[chave];
                    else mapa[chave] = Math.min(31, Math.max(1, Number(v)));
                    return { ...d, config: { ...d.config, fechamentosPorMes: mapa } };
                  });
                }}
              />
            </Campo>
          </div>
        </Panel>

        <Chips
          titulo="Categorias financeiras"
          itens={data.config.categorias}
          onAdd={(v) => setConfig({ categorias: [...data.config.categorias, v] })}
          onRemove={(v) => setConfig({ categorias: data.config.categorias.filter((x) => x !== v) })}
        />
        <Chips
          titulo="Formas de pagamento"
          itens={data.config.formasPagamento}
          onAdd={(v) => setConfig({ formasPagamento: [...data.config.formasPagamento, v] })}
          onRemove={(v) =>
            setConfig({ formasPagamento: data.config.formasPagamento.filter((x) => x !== v) })
          }
        />
        <Chips
          titulo="Categorias da agenda"
          itens={data.config.categoriasAgenda}
          onAdd={(v) => setConfig({ categoriasAgenda: [...data.config.categoriasAgenda, v] })}
          onRemove={(v) =>
            setConfig({ categoriasAgenda: data.config.categoriasAgenda.filter((x) => x !== v) })
          }
        />

        <Panel titulo="Dados e backup" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={exportarExcel}>
              <Download size={15} /> Exportar Excel
            </Btn>
            <Btn variant="soft" onClick={exportarCsv}>
              <Download size={15} /> Exportar CSV
            </Btn>
            <Btn
              variant="soft"
              onClick={() =>
                baixar("multicap-backup.json", JSON.stringify(data, null, 2), "application/json")
              }
            >
              <Download size={15} /> Exportar backup (JSON)
            </Btn>
            <Btn variant="info" onClick={() => csvRef.current?.click()}>
              <Upload size={15} /> Importar CSV
            </Btn>
            <Btn variant="info" onClick={() => jsonRef.current?.click()}>
              <Upload size={15} /> Importar backup
            </Btn>
            <Btn variant="soft" onClick={() => encerrarSessao()}>
              <LogOut size={15} /> Encerrar sessão
            </Btn>
            <Btn
              variant="danger"
              onClick={() =>
                confirmar("Isso apaga TODOS os dados do MULTICAP. Continuar?", () => resetar())
              }
            >
              Resetar tudo
            </Btn>
          </div>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importarCsv(f);
              e.target.value = "";
            }}
          />
          <input
            ref={jsonRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              e.target.value = "";
              void f.text().then((txt) =>
                confirmar("Importar backup e sobrescrever todos os dados atuais?", () => {
                  try {
                    substituirTudo(JSON.parse(txt) as AppData);
                    setAviso("Backup importado com sucesso.");
                  } catch {
                    setAviso("Arquivo inválido.");
                  }
                }),
              );
            }}
          />
        </Panel>
      </div>

      <Modal aberto={!!aviso} onClose={() => setAviso(null)} titulo="Aviso" largura="max-w-sm">
        <p className="text-xs font-semibold text-muted-foreground">{aviso}</p>
        <div className="mt-4 flex justify-end">
          <Btn onClick={() => setAviso(null)}>Ok</Btn>
        </div>
      </Modal>
      {elemento}
    </div>
  );
}
