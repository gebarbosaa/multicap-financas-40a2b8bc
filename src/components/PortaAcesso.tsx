import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, KeyRound, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PortaAcessoProps {
  onEntrarComCodigo?: (codigo: string) => void;
}

export function PortaAcesso({ onEntrarComCodigo }: PortaAcessoProps) {
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [carregandoCodigo, setCarregandoCodigo] = useState(false);
  const [codigoGrupo, setCodigoGrupo] = useState('');
  const [modo, setModo] = useState<'opcao' | 'codigo'>('opcao');
  const { toast } = useToast();

  const handleLoginGoogle = async () => {
    try {
      setCarregandoGoogle(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro no acesso",
        description: error.message || "Não foi possível conectar com o Google.",
        variant: "destructive",
      });
    } finally {
      setCarregandoGoogle(false);
    }
  };

  const handleEntrarPorCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoGrupo.trim()) {
      toast({
        title: "Código necessário",
        description: "Por favor, digite o código de convite do grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCarregandoCodigo(true);
      
      // Busca se o grupo existe pelo código de convite
      const { data: grupo, error } = await supabase
        .from('grupos')
        .select('*')
        .eq('codigo_convite', codigoGrupo.trim().toUpperCase())
        .maybeSingle();

      if (error || !grupo) {
        toast({
          title: "Grupo não encontrado",
          description: "O código digitado é inválido. Verifique com o administrador.",
          variant: "destructive",
        });
        return;
      }

      // Salva a sessão do grupo localmente para uso do app
      localStorage.setItem('multicap_grupo_ativo', JSON.stringify(grupo));
      
      toast({
        title: "Acesso autorizado!",
        description: `Bem-vindo ao grupo ${grupo.nome}.`,
      });

      if (onEntrarComCodigo) {
        onEntrarComCodigo(codigoGrupo.trim().toUpperCase());
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      toast({
        title: "Erro ao validar código",
        description: err.message || "Ocorreu um erro ao verificar o grupo.",
        variant: "destructive",
      });
    } finally {
      setCarregandoCodigo(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-2">
            <span className="text-3xl text-orange-500">✦</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white uppercase">MULTICAP</h1>
          <p className="text-neutral-400 text-sm">
            Controle financeiro compartilhado, seguro e sincronizado
          </p>
        </div>

        {/* Card Principal */}
        <Card className="bg-neutral-900/90 border-neutral-800 backdrop-blur-md text-white shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-semibold text-neutral-200">
              {modo === 'opcao' ? 'Como deseja acessar?' : 'Acessar com Código do Grupo'}
            </CardTitle>
            <CardDescription className="text-neutral-400 text-xs">
              {modo === 'opcao' 
                ? 'Escolha sua forma preferida para entrar no sistema'
                : 'Digite o código do grupo fornecido pelo seu administrador'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {modo === 'opcao' ? (
              <>
                {/* Botão Entrar com Google */}
                <Button
                  onClick={handleLoginGoogle}
                  disabled={carregandoGoogle}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20"
                >
                  <LogIn className="w-5 h-5" />
                  {carregandoGoogle ? "Conectando..." : "Entrar com o Google"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-neutral-900 px-2 text-neutral-500">ou</span>
                  </div>
                </div>

                {/* Botão Entrar por Código */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModo('codigo')}
                  className="w-full border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 text-neutral-200 hover:text-white py-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <KeyRound className="w-5 h-5 text-orange-500" />
                  Entrar com Código do Grupo
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 pt-2">
                  <ShieldCheck className="w-4 h-4 text-neutral-400" />
                  <span>Dados isolados e protegidos por grupo</span>
                </div>
              </>
            ) : (
              <form onSubmit={handleEntrarPorCodigo} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-300">
                    CÓDIGO DE CONVITE DO GRUPO
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: GK140626"
                    value={codigoGrupo}
                    onChange={(e) => setCodigoGrupo(e.target.value.toUpperCase())}
                    className="bg-neutral-950 border-neutral-800 text-white text-center tracking-widest text-lg font-mono py-5 focus:border-orange-500 focus:ring-orange-500"
                    maxLength={10}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={carregandoCodigo}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20"
                >
                  {carregandoCodigo ? "Validando..." : "Entrar no Grupo"}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModo('opcao')}
                  className="w-full text-neutral-400 hover:text-white hover:bg-neutral-800/50 text-xs py-2"
                >
                  ← Voltar para opções de login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



vamos continuar daqui
