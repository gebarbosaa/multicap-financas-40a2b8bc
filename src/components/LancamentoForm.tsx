import { useState } from "react";
import InputData from "@/components/InputData";
import InputMoeda from "@/components/InputMoeda";
import { Btn, Campo } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { corPessoa, hojeISO, uid, type Lancamento } from "@/lib/finance";

export function rotuloResp(r: string) {
  return r === "Conjunta" ? "Ambas" : r;
}

export function EtiquetaResp({ nome }: { nome: string }) {
  const { data } = useStore();
  const cor = corPessoa(nome, data.config);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold text-foreground"
      style={{ background: cor, border: "1px solid oklch(0 0 0 / 0.06)" }}
    >
      <span className="size-1.5 rounded-full bg-foreground/40" />
      {rotuloResp(nome)}
    </span>
  );
}

export function useResponsaveis() {
  const { data } = useStore();
  return [data.config.pessoaA, data.config.pessoaB, "Conjunta"];
}

export default function LancamentoForm({
  inicial,
  dataFixa,
  onSalvar,
  onCancelar,
}: {
  inicial?: Lancamento | undefined;
  dataFixa?: string | undefined;
  onSalvar: (l: Lancamento) => void;
  onCancelar?: (() => void) | undefined;
}) {
  const { data } = useStore();
  const resps = useResponsaveis();
  const [form, setForm] = useState<Lancamento>(
    inicial ?? {
      id: uid(),
      data: dataFixa ?? hojeISO(),
      descricao: "",
      valor: 0,
      categoria: data.config.categorias[0] ?? "Outros",
      formaPagamento: data.config.formasPagamento[0] ?? "Débito",
      responsavel: resps[0] ?? "Conjunta",
      tipo: "saida",
    },
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.descricao.trim() || form.valor <= 0) return;
        onSalvar(form);
      }}
    >
      <div className="sm:col-span-2">
        <span className="label-xs">Tipo de lançamento</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "saida" })}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
              form.tipo === "saida"
                ? "border-red-500/60 bg-red-500/15 text-red-400"
                : "border-border text-muted-foreground"
            }`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "entrada" })}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
              form.tipo === "entrada"
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
                : "border-border text-muted-foreground"
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "transferencia" })}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
              form.tipo === "transferencia"
                ? "border-blue-500/60 bg-blue-500/15 text-blue-400"
                : "border-border text-muted-foreground"
            }`}
          >
            Transferência
          </button>
        </div>
      </div>

      {!dataFixa && (
        <Campo label="Data">
          <InputData value={form.data} onChange={(iso) => setForm({ ...form, data: iso })} />
        </Campo>
      )}

      <Campo label="Descrição">
        <input
          className="field"
          value={form.descricao}
          placeholder="Ex.: Supermercado"
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
      </Campo>
      <Campo label="Valor (R$)">
        <InputMoeda value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
      </Campo>
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
      <Campo label="Responsável">
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
      <div className="flex items-end justify-end gap-2 sm:col-span-2">
        {onCancelar && (
          <Btn variant="soft" onClick={onCancelar}>
            Cancelar
          </Btn>
        )}
        <Btn type="submit">Salvar</Btn>
      </div>
    </form>
  );
}
