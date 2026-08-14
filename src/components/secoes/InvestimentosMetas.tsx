import Investimentos from "@/components/secoes/Investimentos";
import Metas from "@/components/secoes/Metas";
import { Titulo } from "@/components/ui-kit";

export default function InvestimentosMetas() {
  return (
    <div className="animate-section">
      <Investimentos />
      <div className="mt-8">
        <Titulo sub="Objetivos financeiros do casal">Metas</Titulo>
        <Metas embutido />
      </div>
    </div>
  );
}
