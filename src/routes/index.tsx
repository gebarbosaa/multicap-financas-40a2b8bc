import { useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  CloudOff,
  CreditCard,
  LayoutDashboard,
  ClipboardCheck,
  Loader2,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import PortaAcesso, { encerrarSessao } from "@/components/PortaAcesso";
import VisaoGeral from "@/components/secoes/VisaoGeral";
import Calendario from "@/components/secoes/Calendario";
import Extrato from "@/components/secoes/Extrato";
import Contas from "@/components/secoes/Contas";
import Parcelados from "@/components/secoes/Parcelados";
import Faturas from "@/components/secoes/Faturas";
import Mercado from "@/components/secoes/Mercado";
import InvestimentosMetas from "@/components/secoes/InvestimentosMetas";
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

interface SecaoItem {
  id: string;
  nome: string;
  icone: typeof LayoutDashboard;
  C: ComponentType;
}

// Agrupado por finalidade, para o menu ficar mais fácil de escanear.
const GRUPOS: { titulo: string; itens: SecaoItem[] }[] = [
  {
    titulo: "Principal",
    itens: [
      { id: "visao", nome: "Visão Geral", icone: LayoutDashboard, C: VisaoGeral },
      { id: "calendario", nome: "Calendário", icone: CalendarDays, C: Calendario },
      { id: "extrato", nome: "Extrato", icone: Wallet, C: Extrato },
    ],
  },
  {
    titulo: "Contas",
    itens: [
      { id: "contas", nome: "Contas a pagar", icone: ClipboardCheck, C: Contas },
      { id: "parcelados", nome: "Parcelados", icone: CreditCard, C: Parcelados },
      { id: "faturas", nome: "Faturas", icone: Receipt, C: Faturas },
    ],
  },
  {
    titulo: "Planejamento",
    itens: [
      { id: "mercado", nome: "Mercado", icone: ShoppingCart, C: Mercado },
      { id: "investimentos", nome: "Investimentos", icone: PiggyBank, C: InvestimentosMetas },
    ],
  },
];

const CONFIG_ITEM: SecaoItem = {
  id: "config",
  nome: "Configurações",
  icone: Settings,
  C: Configuracoes,
};
const SECOES: SecaoItem[] = GRUPOS.flatMap((g) => g.itens).concat([CONFIG_ITEM]);

function StatusSincronizacao({ className }: { className?: string }) {
  const { sincronizando, erroSincronizacao, pronto } = useStore();

  if (!pronto) return null;

  if (erroSincronizacao) {
    return (
      <span
        title="Não foi possível sincronizar com os outros aparelhos agora. Os dados continuam salvos neste aparelho."
        className={`flex items-center gap-1.5 text-[10px] font-bold text-destructive ${className ?? ""}`}
      >
        <CloudOff size={12} /> Sem sincronização
      </span>
    );
  }

  if (sincronizando) {
    return (
      <span
        className={`flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground ${className ?? ""}`}
      >
        <Loader2 size={12} className="animate-spin" /> Sincronizando
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground ${className ?? ""}`}
    >
      <span className="size-1.5 rounded-full bg-primary" /> Sincronizado
    </span>
  );
}

function App() {
  const [ativa, setAtiva] = useState<string>("visao");
  const atual = SECOES.find((s) => s.id === ativa) ?? SECOES[0]!;
  const Conteudo = atual.C;

  return (
    <PortaAcesso>
      <StoreProvider>
        <div className="min-h-screen bg-background">
          {/* Sidebar (desktop) */}
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-card px-3.5 py-5 min-[900px]:flex">
            <div className="mb-1 flex items-center gap-2.5 px-2">
              <span className="glow flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles size={16} strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">MULTICAP</span>
            </div>
            <div className="mb-6 px-2">
              <StatusSincronizacao />
            </div>

            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
              {GRUPOS.map((grupo) => (
                <div key={grupo.titulo}>
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {grupo.titulo}
                  </p>
                  <div className="flex flex-col gap-1">
                    {grupo.itens.map((s) => {
                      const Icone = s.icone;
                      const ativo = s.id === ativa;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setAtiva(s.id)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold tracking-wide transition-all duration-200 ${
                            ativo
                              ? "bg-primary text-primary-foreground shadow-glow"
                              : "text-muted-foreground hover:bg-surface hover:text-foreground"
                          }`}
                        >
                          <Icone size={16} />
                          {s.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              <button
                onClick={() => setAtiva("config")}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold tracking-wide transition-all duration-200 ${
                  ativa === "config"
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Settings size={16} />
                Configurações
              </button>
              <button
                onClick={() => encerrarSessao()}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold tracking-wide text-muted-foreground transition-all duration-200 hover:bg-surface hover:text-destructive"
              >
                <LogOut size={16} />
                Encerrar sessão
              </button>
            </div>
          </aside>

          <main className="px-4 pb-32 pt-6 min-[900px]:ml-[248px] min-[900px]:px-8 min-[900px]:pb-10">
            <div className="mx-auto max-w-6xl">
              <div className="mb-4 flex items-center justify-between gap-2.5 min-[900px]:hidden">
                <div className="flex items-center gap-2.5">
                  <span className="glow flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles size={14} strokeWidth={2.4} />
                  </span>
                  <span className="font-display text-base font-bold tracking-tight">MULTICAP</span>
                </div>
                <StatusSincronizacao />
              </div>
              <div key={ativa}>
                <Conteudo />
              </div>
            </div>
          </main>

          {/* Navegação (mobile) — barra flutuante e arredondada */}
          <nav className="fixed inset-x-3 bottom-3 z-30 min-[900px]:hidden">
            <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-lift backdrop-blur-md">
              {SECOES.map((s) => {
                const Icone = s.icone;
                const ativo = s.id === ativa;
                return (
                  <button
                    key={s.id}
                    onClick={() => setAtiva(s.id)}
                    className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-[9px] font-bold transition-all duration-200 ${
                      ativo ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Icone size={17} />
                    <span className="whitespace-nowrap">{s.nome}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </StoreProvider>
    </PortaAcesso>
  );
}
