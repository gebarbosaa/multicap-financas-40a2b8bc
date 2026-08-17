export function formatarMoeda(valorEmCentavos: number | string): string {
  const apenasNumeros = String(valorEmCentavos).replace(/\D/g, '');
  const valorNumerico = Number(apenasNumeros) / 100;
  
  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function converterParaNumero(valorFormatado: string): number {
  const apenasNumeros = valorFormatado.replace(/\D/g, '');
  return Number(apenasNumeros) / 100;
}