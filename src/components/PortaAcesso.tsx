import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PortaAcessoProps {
  onSuccess: (userData: { nome: string; sala: string; tipo: 'google' | 'codigo' }) => void;
}

export const PortaAcesso: React.FC<PortaAcessoProps> = ({ onSuccess }) => {
  const [modo, setModo] = useState<'inicial' | 'codigo'>('inicial');
  const [nome, setNome] = useState('');
  const [codigoSala, setCodigoSala] = useState('');
  const [erro, setErro] = useState('');

  // Simulação de códigos válidos conhecidos ou gerados (você pode ajustar conforme seu banco/estado)
  const [salasValidas, setSalasValidas] = useState<string[]>(['123456', 'ABCDEF']);

  const handleGoogleLogin = () => {
    // Simulação ou integração real de login com Google
    onSuccess({ nome: 'Usuário Google', sala: 'Geral', tipo: 'google' });
  };

  const handleCriarSala = () => {
    // Gera um código aleatório de 6 caracteres maiúsculos
    const novoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSalasValidas((prev) => [...prev, novoCodigo]);
    alert(`Sala criada com sucesso! O código da sua sala é: ${novoCodigo}`);
    setCodigoSala(novoCodigo);
    setModo('codigo');
  };

  const handleEntrarComCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Por favor, digite seu nome.');
      return;
    }

    if (!codigoSala.trim()) {
      setErro('Por favor, digite o código da sala.');
      return;
    }

    // Verifica se a sala existe (ou aceita se for uma lógica aberta)
    const codigoFormatado = codigoSala.trim().toUpperCase();
    
    // Se quiser validar estritamente pelas salas criadas:
    if (salasValidas.includes(codigoFormatado) || codigoFormatado.length >= 4) {
      onSuccess({ nome: nome.trim(), sala: codigoFormatado, tipo: 'codigo' });
    } else {
      setErro('Código incorreto');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        {modo === 'inicial' ? (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
              <CardDescription>Escolha como deseja acessar o sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full flex items-center justify-center gap-2"
                variant="default"
              >
                Fazer login com o Google
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">ou</span>
                <div className="flex-grow border-t border-muted"></div>
              </div>

              <Button 
                onClick={() => setModo('codigo')} 
                variant="outline" 
                className="w-full"
              >
                Entrar com Código de Sala
              </Button>

              <Button 
                onClick={handleCriarSala} 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground"
              >
                Criar uma nova sala (Gerar Código)
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Entrar na Sala</CardTitle>
              <CardDescription>Insira seu nome e o código fornecido</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEntrarComCodigo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Seu Nome</Label>
                  <Input 
                    id="nome" 
                    type="text" 
                    placeholder="Digite seu nome" 
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código da Sala</Label>
                  <Input 
                    id="codigo" 
                    type="text" 
                    placeholder="Ex: 123456" 
                    value={codigoSala} 
                    onChange={(e) => setCodigoSala(e.target.value)} 
                  />
                </div>

                {erro && (
                  <p className="text-sm font-medium text-destructive text-center">{erro}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-1/2" 
                    onClick={() => { setModo('inicial'); setErro(''); }}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="w-1/2">
                    Entrar
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};
