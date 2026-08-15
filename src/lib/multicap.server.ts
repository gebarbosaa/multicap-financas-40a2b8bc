// Validação do código de acesso do domicílio, no servidor.
// O código nunca precisa dar acesso direto ao banco: só estas funções falam
// com a tabela, usando a chave de serviço.
const CODIGOS_VALIDOS = new Set(["GK140626"]);

export function codigoValido(codigo: string): boolean {
  return CODIGOS_VALIDOS.has(codigo.trim().toUpperCase());
}

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}
