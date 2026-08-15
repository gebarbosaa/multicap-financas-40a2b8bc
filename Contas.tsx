import { useState } from "react";
import { Titulo } from "@/components/ui-kit";
import ContasAPagar from "@/components/secoes/ContasAPagar";
import CustosFixos from "@/components/secoes/CustosFixos";

const ABAS = [
  { id: "pendentes", nome: "Pendentes" },
  { id: "fixas", nome: "Fixas" },
] as const;

export default function Contas() {
  const [aba, setAba] = useState<string>("pendentes");

  return (
    <div className="animate-section">
      <Titulo sub="Contas do mês e despesas recorrentes">Contas</Titulo>

      <div className="mb-5 flex gap-1.5 rounded-2xl bg-card p-1.5">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold tracking-wide transition-colors ${
              aba === a.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a.nome}
          </button>
        ))}
      </div>

      {aba === "pendentes" ? <ContasAPagar embutido /> : <CustosFixos embutido />}
    </div>
  );
}
