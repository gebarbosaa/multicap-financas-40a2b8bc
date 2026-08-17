import { useState, type ReactNode } from "react";
import { KeyRound, Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Btn } from "@/components/ui-kit";
import { AuthProvider, useAuth } from "@/lib/auth";

function TelaLogin() {
  const { entrarComGoogle } = useAuth();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full blur-3xl"
        style={{ background: "rgb(232 80 2 / 0.2)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 size-[380px] rounded-full blur-3xl"
        style={{ background: "rgb(193 8 1 / 0.16)" }}
      />
      <div className="relative w-full max-w-sm text-center">
        <span className="glow mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles size={24} strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">MULTICAP</h1>
        <p className="mt-1.5 text-xs font-semibold normal-case text-muted-foreground">
          Controle financeiro compartilhado, seguro e sincronizado
        </p>
        <div className="panel animate-section mt-7 p-7">
          <p className="mb-5 text-[11px] font-semibold normal-case text-muted-foreground">
            Entre com sua conta Google — é o mesmo login que habilita a sincronização com o Google
            Agenda mais adiante.
          </p>
          <Btn className="w-full py-3" onClick={entrarComGoogle}>
            Entrar com Google
          </Btn>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] font-bold normal-case text-muted-foreground">
            <ShieldCheck size={13} /> Login real, dados isolados por grupo
          </p>
        </div>
      </div>
    </div>
  );
}

function TelaOnboarding() {
  const { criarGrupo, entrarEmGrupo, sair, perfil } = useAuth();
  const [modo, setModo] = useState<"escolha" | "criar" | "entrar">("escolha");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleCriar = async () => {
    if (!nome.trim()) return;
    setCarregando(true);
    setErro("");
    try {
      await criarGrupo(nome.trim());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar o grupo.");
    } finally {
      setCarregando(false);
    }
  };

  const handleEntrar = async () => {
    if (!codigo.trim()) return;
    setCarregando(true);
    setErro("");
    try {
      await entrarEmGrupo(codigo.trim());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Código inválido.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="glow mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles size={20} />
          </span>
          <h1 className="font-display text-lg font-bold">Olá, {perfil?.nome ?? "tudo bem"}!</h1>
          <p className="mt-1 text-[11px] font-semibold normal-case text-muted-foreground">
            Você ainda não faz parte de nenhum grupo financeiro
          </p>
        </div>

        <div className="panel animate-section p-6">
          {modo === "escolha" && (
            <div className="flex flex-col gap-2.5">
              <Btn onClick={() => setModo("criar")} className="w-full py-3">
                <Users size={16} /> Criar grupo
              </Btn>
              <Btn variant="soft" onClick={() => setModo("entrar")} className="w-full py-3">
                <KeyRound size={16} /> Entrar em um grupo
              </Btn>
            </div>
          )}

          {modo === "criar" && (
            <div>
              <p className="label-xs">Nome do grupo</p>
              <input
                autoFocus
                className="field"
                placeholder="Ex: Casa, Família Silva…"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <p className="mt-3 text-[10px] font-semibold normal-case text-muted-foreground">
                Você vira o administrador e recebe um código de convite pra compartilhar com quem
                mais vai usar. Pode trocar esse código depois em Configurações.
              </p>
              {erro && <p className="mt-2 text-[10px] font-bold text-destructive">{erro}</p>}
              <div className="mt-5 flex gap-2">
                <Btn variant="ghost" onClick={() => setModo("escolha")}>
                  Voltar
                </Btn>
                <Btn className="flex-1" disabled={carregando} onClick={handleCriar}>
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : "Criar grupo"}
                </Btn>
              </div>
            </div>
          )}

          {modo === "entrar" && (
            <div>
              <p className="label-xs">Código de convite</p>
              <input
                autoFocus
                className="field num text-center tracking-[0.4em]"
                placeholder="ABC123"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
              {erro && <p className="mt-2 text-[10px] font-bold text-destructive">{erro}</p>}
              <div className="mt-5 flex gap-2">
                <Btn variant="ghost" onClick={() => setModo("escolha")}>
                  Voltar
                </Btn>
                <Btn className="flex-1" disabled={carregando} onClick={handleEntrar}>
                  {carregando ? <Loader2 size={14} className="animate-spin" /> : "Entrar"}
                </Btn>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={sair}
          className="mx-auto mt-5 block text-[10px] font-bold normal-case text-muted-foreground hover:text-destructive"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

function Portal({ children }: { children: ReactNode }) {
  const { carregando, session, grupoAtivo } = useAuth();
  if (carregando) return null;
  if (!session) return <TelaLogin />;
  if (!grupoAtivo) return <TelaOnboarding />;
  return <>{children}</>;
}

export default function PortaAcesso({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Portal>{children}</Portal>
    </AuthProvider>
  );
}