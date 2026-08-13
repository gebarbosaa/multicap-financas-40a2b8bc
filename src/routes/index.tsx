import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  ClipboardCheck,
  ListChecks,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  ShoppingCart,
  Target,
  Wallet,
} from "lucide-react";
import { StoreProvider } from "@/lib/store";
import PortaAcesso from "@/components/PortaAcesso";
import VisaoGeral from "@/components/secoes/VisaoGeral";
import Calendario from "@/components/secoes/Calendario";
import FluxoMensal from "@/components/secoes/FluxoMensal";
import Orcamento from "@/components/secoes/Orcamento";
import CustosFixos from "@/components/secoes/CustosFixos";
import Parcelados from "@/components/secoes/Parcelados";
import Faturas from "@/components/secoes/Faturas";
import ContasAPagar from "@/components/secoes/ContasAPagar";
import ListaCompras from "@/components/secoes/ListaCompras";
import ModoMercado from "@/components/secoes/ModoMercado";
import Agenda from "@/components/secoes/Agenda";
import Metas from "@/components/secoes/Metas";
import Investimentos from "@/components/secoes/Investimentos";
import Configuracoes from "@/components/secoes/Configuracoes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MULTICAP — Controle Financeiro Pessoal a Dois" },
      {
        name: "description",
        content:
          "MULTICAP: controle financeiro doméstico compartilhado com gastos, custos fixos, parcelados, faturas, orçamento, metas e lista de compras.",
      },
      { property: "og:title", content: "MULTICAP — Controle Financeiro Pessoal a Dois" },
      {
        property: "og:description",
        content:
          "Gerencie gastos, custos fixos, parcelados, faturas, orçamento mensal, metas e compras em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const SECOES = [
  { id: "visao", nome: "Visão Geral", icone: LayoutDashboard, C: VisaoGeral },
  { id: "calendario", nome: "Calendário", icone: CalendarDays, C: Calendario },
  { id: "fluxo", nome: "Fluxo Mensal", icone: Wallet, C: FluxoMensal },
  { id: "orcamento", nome: "Orçamento Mensal", icone: BarChart3, C: Orcamento },
  { id: "fixos", nome: "Custos Fixos", icone: Repeat, C: CustosFixos },
  { id: "parcelados", nome: "Parcelados", icone: CreditCard, C: Parcelados },
  { id: "faturas", nome: "Faturas", icone: Receipt, C: Faturas },
  { id: "contas", nome: "Contas a Pagar", icone: ClipboardCheck, C: ContasAPagar },
  { id: "lista", nome: "Lista de Compras", icone: ListChecks, C: ListaCompras },
  { id: "mercado", nome: "Modo Mercado", icone: ShoppingCart, C: ModoMercado },
  { id: "agenda", nome: "Agenda", icone: CalendarRange, C: Agenda },
  { id: "metas", nome: "Metas", icone: Target, C: Metas },
  { id: "investimentos", nome: "Investimentos", icone: PiggyBank, C: Investimentos },
  { id: "config", nome: "Configurações", icone: Settings, C: Configuracoes },
] as const;

function App() {
  const [ativa, setAtiva] = useState<string>("visao");
  const atual = SECOES.find((s) => s.id === ativa) ?? SECOES[0];
  const Conteudo = atual.C;

  return (
    <PortaAcesso>
    <StoreProvider>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-border bg-card px-3 py-5 min-[900px]:flex">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <span className="size-3.5 rounded-full bg-primary" />
            <span className="font-display text-lg font-bold tracking-tight">MULTICAP</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {SECOES.map((s) => {
              const Icone = s.icone;
              const ativo = s.id === ativa;
              return (
                <button
                  key={s.id}
                  onClick={() => setAtiva(s.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[11px] font-bold tracking-wide transition-all duration-200 ${
                    ativo
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icone size={16} />
                  {s.nome}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="px-4 pb-28 pt-6 min-[900px]:ml-[236px] min-[900px]:px-8 min-[900px]:pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-2.5 min-[900px]:hidden">
              <span className="size-3 rounded-full bg-primary" />
              <span className="font-display text-base font-bold">MULTICAP</span>
            </div>
            <div key={ativa}>
              <Conteudo />
            </div>
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-border bg-card px-2 py-2 min-[900px]:hidden">
          {SECOES.map((s) => {
            const Icone = s.icone;
            const ativo = s.id === ativa;
            return (
              <button
                key={s.id}
                onClick={() => setAtiva(s.id)}
                className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-bold transition-colors ${
                  ativo ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Icone size={17} />
                <span className="whitespace-nowrap">{s.nome}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </StoreProvider>
    </PortaAcesso>
  );
}
