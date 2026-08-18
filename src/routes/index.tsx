import { useState } from 'react';
import { PortaAcesso } from '@/components/PortaAcesso';
// Seus outros componentes da aplicação...

export default function Index() {
  const [autenticado, setAutenticado] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<any>(null);

  const handleSuccess = (userData: any) => {
    setDadosUsuario(userData);
    setAutenticado(true);
  };

  if (!autenticado) {
    return <PortaAcesso onSuccess={handleSuccess} />;
  }

  return (
    <div>
      {/* Aqui entra a sua tela principal do app após logado */}
      <h1>Bem-vindo, {dadosUsuario?.nome}! (Sala: {dadosUsuario?.sala})</h1>
    </div>
  );
}
