import { useState } from 'react';
import { PortaAcesso } from '@/components/PortaAcesso';
import { Button } from "@/components/ui/button";

export default function Index() {
  const [autenticado, setAutenticado] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<{ nome: string; sala: string; tipo: 'google' | 'codigo' } | null>(null);

  const handleSuccess = (userData: { nome: string; sala: string; tipo: 'google' | 'codigo' }) => {
    setDadosUsuario(userData);
    setAutenticado(true);
  };

  const handleLogout = () => {
    setAutenticado(false);
    setDadosUsuario(null);
  };

  // Se não estiver autenticado, exibe a porta de acesso unificada
  if (!autenticado) {
    return <PortaAcesso onSuccess={handleSuccess} />;
  }

  // Se estiver autenticado, exibe o painel principal do sistema atrelado aos dados da sessão
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-card p-6 rounded-lg shadow-md space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Painel Principal</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a), <span className="font-semibold text-foreground">{dadosUsuario?.nome}</span>!
        </p>
        <div className="p-4 bg-muted rounded-md inline-block text-sm">
          <span>Sala Conectada: </span>
          <span className="font-mono font-bold">{dadosUsuario?.sala}</span>
          <span className="block text-xs text-muted-foreground mt-1">Tipo de acesso: {dadosUsuario?.tipo}</span>
        </div>
        <div className="pt-4">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Sair / Trocar Sala
          </Button>
        </div>
      </div>
    </div>
  );
}
