export type Responsavel = string; // nome pessoa A/B ou "Conjunta"

export interface Lancamento {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number;
  categoria: string;
  formaPagamento: string;
  responsavel: Responsavel;
}

export interface CustoFixo {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  formaPagamento: string;
  diaVencimento: number;
  mesesAtivos: number[];
  responsavel: Responsavel;
}

export interface Parcelado {
  id: string;
  descricao: string;
  dataCompra: string;
  valorTotal: number;
  numeroParcelas: number;
  categoria: string;
  formaPagamento: string;
  responsavel: Responsavel;
}

export type UnidadeCompra = "UN" | "KG" | "L" | "PCT" | "CX";

export interface ItemCompra {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number | null;
  unidade: UnidadeCompra;
  preco: number | null;
  comprado: boolean;
}

export interface ListaCompras {
  id: string;
  nome: string;
  itens: ItemCompra[];
}

export interface EventoAgenda {
  id: string;
  titulo: string;
  data: string;
  categoria: string;
}

export interface Meta {
  id: string;
  nome: string;
  valorAtual: number;
  valorAlvo: number;
}

export interface Investimento {
  id: string;
  nome: string;
  tipo: string;
  valorAplicado: number;
  valorAtual: number;
}

export interface Config {
  pessoaA: string;
  pessoaB: string;
  diaFechamentoPadrao: number;
  fechamentosPorMes: Record<string, number>;
  categorias: string[];
  formasPagamento: string[];
  categoriasAgenda: string[];
  capa?: string;
  nomeGrupo?: string;
}

export interface AppData {
  lancamentos: Lancamento[];
  custosFixos: CustoFixo[];
  parcelados: Parcelado[];
  tetos: Record<string, Record<string, number>>;
  listas: ListaCompras[];
  agenda: EventoAgenda[];
  metas: Meta[];
  investimentos: Investimento[];
  pagamentos: Record<string, boolean>;
  config: Config;
}


export const CATEGORIAS_PADRAO = [
  "Moradia",
  "Serviços Essenciais",
  "Saúde",
  "Educação",
  "Transporte",
  "Cuidados Pessoais",
  "Alimentação",
  "Ifood/Refeição",
  "Lazer",
  "Presentes & Vestuário",
];

export const FORMAS_PADRAO = ["Débito", "Cartão de Crédito", "Pix"];
export const CATEGORIAS_AGENDA_PADRAO = ["Mercado", "Contas", "Folga", "Lazer"];

export const CATEGORIAS_COMPRA = [
  "Hortifruti",
  "Açougue/Carne",
  "Mercearia",
  "Laticínios/Frios",
  "Padaria",
  "Bebidas",
  "Limpeza",
  "Higiene/Farmácia",
  "Outros",
];

export const UNIDADES: UnidadeCompra[] = ["UN", "KG", "L", "PCT", "CX"];

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const dadosIniciais = (): AppData => ({
  lancamentos: [],
  custosFixos: [],
  parcelados: [],
  tetos: {},
  listas: [{ id: uid(), nome: "Lista Principal", itens: [] }],
  agenda: [],
  metas: [],
  investimentos: [],
  pagamentos: {},

  config: {
    pessoaA: "Geovanna",
    pessoaB: "Karen",
    diaFechamentoPadrao: 5,
    fechamentosPorMes: {},
    categorias: [...CATEGORIAS_PADRAO],
    formasPagamento: [...FORMAS_PADRAO],
    categoriasAgenda: [...CATEGORIAS_AGENDA_PADRAO],
  },
});

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const brl = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const dataBR = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const chaveMes = (m: number, y: number) => `${y}-${String(m + 1).padStart(2, "0")}`;

/** Posição da parcela no mês alvo (1-based). 0 = não vigente. */
export function posicaoParcela(p: Parcelado, m: number, y: number): number {
  const partes = p.dataCompra.split("-").map(Number);
  const ay = partes[0] ?? 0;
  const am = partes[1] ?? 1;
  const pos = y * 12 + m - (ay * 12 + (am - 1)) + 1;
  return pos >= 1 && pos <= p.numeroParcelas ? pos : 0;
}

export const valorParcela = (p: Parcelado) =>
  p.numeroParcelas > 0 ? p.valorTotal / p.numeroParcelas : 0;

export const fixoAtivo = (c: CustoFixo, m: number) => c.mesesAtivos.includes(m);

export const lancamentosDoMes = (l: Lancamento[], m: number, y: number) =>
  l.filter((x) => {
    const partes = x.data.split("-").map(Number);
    return partes[0] === y && (partes[1] ?? 0) - 1 === m;
  });

export function totaisDoMes(d: AppData, m: number, y: number) {
  const aVista = lancamentosDoMes(d.lancamentos, m, y).reduce((s, x) => s + x.valor, 0);
  const parcelados = d.parcelados
    .filter((p) => posicaoParcela(p, m, y) > 0)
    .reduce((s, p) => s + valorParcela(p), 0);
  const fixos = d.custosFixos.filter((c) => fixoAtivo(c, m)).reduce((s, c) => s + c.valor, 0);
  return { aVista, parcelados, fixos, total: aVista + parcelados + fixos };
}

export function porCategoria(d: AppData, m: number, y: number): Record<string, number> {
  const acc: Record<string, number> = {};
  const add = (cat: string, v: number) => (acc[cat] = (acc[cat] ?? 0) + v);
  lancamentosDoMes(d.lancamentos, m, y).forEach((l) => add(l.categoria, l.valor));
  d.parcelados.forEach((p) => posicaoParcela(p, m, y) > 0 && add(p.categoria, valorParcela(p)));
  d.custosFixos.forEach((c) => fixoAtivo(c, m) && add(c.categoria, c.valor));
  return acc;
}

export function porResponsavel(d: AppData, m: number, y: number): Record<string, number> {
  const acc: Record<string, number> = {};
  const add = (r: string, v: number) => (acc[r] = (acc[r] ?? 0) + v);
  lancamentosDoMes(d.lancamentos, m, y).forEach((l) => add(l.responsavel, l.valor));
  d.parcelados.forEach((p) => posicaoParcela(p, m, y) > 0 && add(p.responsavel, valorParcela(p)));
  d.custosFixos.forEach((c) => fixoAtivo(c, m) && add(c.responsavel, c.valor));
  return acc;
}

export function vencendoEmBreve(d: AppData) {
  const hoje = new Date();
  const m = hoje.getMonth();
  const dia = hoje.getDate();
  return d.custosFixos
    .filter((c) => fixoAtivo(c, m))
    .map((c) => ({ custo: c, faltam: c.diaVencimento - dia }))
    .filter((x) => x.faltam >= 0 && x.faltam <= 5)
    .sort((a, b) => a.faltam - b.faltam);
}

export const fechamentoDoMes = (d: AppData, m: number, y: number) =>
  d.config.fechamentosPorMes[chaveMes(m, y)] ?? d.config.diaFechamentoPadrao;

export function subtotalItem(i: ItemCompra) {
  const preco = i.preco ?? 0;
  if (i.unidade === "KG") return preco * (i.quantidade ?? 0);
  return preco * (i.quantidade || 1);
}

export const unidadePadrao = (categoria: string): UnidadeCompra =>
  categoria === "Hortifruti" || categoria === "Açougue/Carne" ? "KG" : "UN";

export const gastoPorDia = (d: AppData, m: number, y: number) => {
  const acc: Record<number, number> = {};
  lancamentosDoMes(d.lancamentos, m, y).forEach((l) => {
    const dia = Number(l.data.split("-")[2]);
    acc[dia] = (acc[dia] ?? 0) + l.valor;
  });
  return acc;
};

export const num = (v: string) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function corPessoa(nome: string, c: Config): string {
  if (nome === c.pessoaA) return "var(--color-pessoa-a)";
  if (nome === c.pessoaB) return "var(--color-pessoa-b)";
  return "var(--color-chart-5)";
}

export interface ContaMes {
  chave: string;
  nome: string;
  detalhe: string;
  valor: number;
  vencimento: string; // ISO
  tipo: "Fixo" | "Parcelado" | "Fatura";
  responsavel: Responsavel;
}

export const ehCartao = (forma: string) => /cart|cr[eé]dito/i.test(forma);

const diaValido = (dia: number, m: number, y: number) =>
  Math.min(Math.max(dia || 1, 1), new Date(y, m + 1, 0).getDate());

const isoDia = (dia: number, m: number, y: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(diaValido(dia, m, y)).padStart(2, "0")}`;

/** Contas do mês: custos fixos, parcelas e faturas de cartão (agregadas). */
export function contasDoMes(d: AppData, m: number, y: number): ContaMes[] {
  const contas: ContaMes[] = [];
  const mk = chaveMes(m, y);

  d.custosFixos
    .filter((c) => fixoAtivo(c, m) && !ehCartao(c.formaPagamento))
    .forEach((c) =>
      contas.push({
        chave: `${mk}:fixo:${c.id}`,
        nome: c.descricao,
        detalhe: `${c.categoria} · ${c.formaPagamento}`,
        valor: c.valor,
        vencimento: isoDia(c.diaVencimento, m, y),
        tipo: "Fixo",
        responsavel: c.responsavel,
      }),
    );

  d.parcelados.forEach((p) => {
    const pos = posicaoParcela(p, m, y);
    if (pos <= 0 || ehCartao(p.formaPagamento)) return;
    contas.push({
      chave: `${mk}:parc:${p.id}`,
      nome: p.descricao,
      detalhe: `Parcela ${pos}/${p.numeroParcelas} · ${p.categoria}`,
      valor: valorParcela(p),
      vencimento: isoDia(Number(p.dataCompra.split("-")[2]), m, y),
      tipo: "Parcelado",
      responsavel: p.responsavel,
    });
  });

  d.config.formasPagamento.filter(ehCartao).forEach((forma) => {
    const aVista = lancamentosDoMes(d.lancamentos, m, y)
      .filter((l) => l.formaPagamento === forma)
      .reduce((s, l) => s + l.valor, 0);
    const parcelas = d.parcelados
      .filter((p) => p.formaPagamento === forma && posicaoParcela(p, m, y) > 0)
      .reduce((s, p) => s + valorParcela(p), 0);
    const fixos = d.custosFixos
      .filter((c) => c.formaPagamento === forma && fixoAtivo(c, m))
      .reduce((s, c) => s + c.valor, 0);
    const total = aVista + parcelas + fixos;
    if (total <= 0) return;
    contas.push({
      chave: `${mk}:fatura:${forma}`,
      nome: `Fatura ${forma}`,
      detalhe: "À vista + parcelas + fixos no cartão",
      valor: total,
      vencimento: isoDia(fechamentoDoMes(d, m, y), m, y),
      tipo: "Fatura",
      responsavel: "Conjunta",
    });
  });

  return contas.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}
