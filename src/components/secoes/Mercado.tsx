import { useState } from "react";
import { Titulo } from "@/components/ui-kit";
import ListaCompras from "@/components/secoes/ListaCompras";
import ModoMercado from "@/components/secoes/ModoMercado";

const ABAS = [
  { id: "lista", nome: "Listas" },
  { id: "modo", nome: "Modo Mercado" },
] as const;

export default function Mercado() {
  const [aba, setAba] = useState<string>("lista");

  return (
    <div className="animate-section">
      <Titulo sub="Listas de compras e modo compras no mercado">Mercado</Titulo>

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

      {aba === "lista" ? <ListaCompras embutido /> : <ModoMercado embutido />}
    </div>
  );
}
