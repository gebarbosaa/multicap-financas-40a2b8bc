import { useState } from "react";
import { CreditCard, PiggyBank, Receipt, Wallet } from "lucide-react";
import { Titulo } from "@/components/ui-kit";
import CustosFixos from "./CustosFixos";
import Parcelados from "./Parcelados";
import Faturas from "./Faturas";
import Orcamento from "./Orcamento";

const SUBABAS = [
  { id: "fixos", nome: "Custos Fixos", icone: Wallet, C: CustosFixos },
  { id: "parcelados", nome: "Parcelamentos", icone: CreditCard, C: Parcelados },
  { id: "faturas", nome: "Cartão de Crédito", icone: Receipt, C: Faturas },
  { id: "orcamento", nome: "Orçamento Mensal", icone: PiggyBank, C: Orcamento },
] as const;

export default function Financas() {
  const [aba, setAba] = useState<(typeof SUBABAS)[number]["id"]>("fixos");
  const atual = SUBABAS.find((s) => s.id === aba) ?? SUBABAS[0];
  const Conteudo = atual.C;

  return (
    <div className="animate-section">
      <Titulo sub="Custos fixos, parcelamentos, cartão de crédito e orçamento mensal">
        Finanças
      </Titulo>

      <div className="mb-5 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-1.5 shadow-soft">
        {SUBABAS.map((s) => {
          const Icone = s.icone;
          const ativo = s.id === aba;
          return (
            <button
              key={s.id}
              onClick={() => setAba(s.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-bold tracking-normal transition-all duration-200 ${
                ativo
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icone size={14} />
              {s.nome}
            </button>
          );
        })}
      </div>

      <div key={aba} className="animate-section">
        <Conteudo embutido />
      </div>
    </div>
  );
}
