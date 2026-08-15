# Multicap: Seu Controle Financeiro

Crie um app web de controle financeiro pessoal completo, em português do Brasil, chamado "MULTICAP". Deve ser um site funcional (SPA), com persistência de dados (salvando tudo automaticamente, sem precisar de botão "salvar"), pronto para uso real por duas pessoas que dividem finanças.

1. IDENTIDADE VISUAL

Paleta de cores (tema claro, "verde-oliva"):

Fundo geral: #eef1e9

Fundo da barra lateral / branco: #ffffff

Painéis/cards: #ffffff

Fundo secundário (dentro de painéis): #f2f5ee

Bordas: #e4e9dd

Texto principal: #16241a

Texto secundário/muted: #7c8873

Cor de destaque (accent/primária): verde #159e63 (usada em botões, valores positivos, gráficos, foco de inputs)

Vermelho (alertas, saídas, excluir): #e2574c

Azul (secundária): #3d7ef2

Âmbar (avisos, vencimentos): #d9a13c

Tipografia:

Títulos (h1/h2/h3): fonte geométrica sans-serif tipo "Space Grotesk", peso 600–700

Corpo/textos/labels: "Manrope", peso 400–700

Números, valores monetários, datas e códigos: fonte monoespaçada tipo "IBM Plex Mono"

Estilo geral: TODO o texto da interface em CAIXA ALTA (uppercase) como assinatura visual — botões, labels, menus, valores de categoria. Cantos bem arredondados (14–20px de raio), sombras suaves, micro-animações leves (150–250ms) em hover (elevação de card, leve translateY, scale em botões).

Layout:

Desktop: sidebar fixa à esquerda (~236px), com um logotipo/nome no topo (bolinha verde + "MULTICAP") e lista vertical de itens de menu com ícone + rótulo. Item ativo destacado com fundo verde claro e texto verde.

Mobile (abaixo de ~900px): sidebar desaparece e vira uma barra de navegação inferior fixa, com os mesmos itens em ícone + rótulo pequeno, com rolagem horizontal se não couber.

Conteúdo principal com respiro generoso (padding ~24-32px), grids responsivos que colapsam para 1 coluna em telas pequenas.

Modais centralizados com fundo escurecido/blur para criar e editar registros.

2. NAVEGAÇÃO — 13 SEÇÕES (abas que trocam de conteúdo sem recarregar a página)

Nesta ordem exata:

Visão Geral

Calendário

Fluxo Mensal

Orçamento Mensal

Custos Fixos

Parcelados

Faturas

Lista de Compras

Modo Mercado

Agenda

Metas

Investimentos

Configurações

Um seletor de mês (botões "‹ mês anterior" / "› próximo mês" com o rótulo "NOME DO MÊS + ANO" no meio) deve aparecer no topo de toda tela que trabalha com dados mensais (Visão Geral, Calendário, Fluxo Mensal, Orçamento, Faturas), navegando entre meses/anos de forma independente por tela.

3. MODELO DE DADOS (estruturas exatas a implementar)

Use estas entidades (nomes de campos podem ser adaptados, mas mantenha o significado):

Lançamento (gasto à vista):
  id, data (YYYY-MM-DD), descricao, valor (number), categoria,
  formaPagamento, responsavel (Pessoa A | Pessoa B | Conjunta/Ambas)

CustoFixo (despesa recorrente mensal):
  id, descricao, valor, categoria, formaPagamento,
  diaVencimento (1-31), mesesAtivos (array de 0-11, ex.: [0,1,2...11] = ativo o ano todo),
  responsavel

Parcelado (compra parcelada):
  id, descricao, dataCompra (YYYY-MM-DD), valorTotal, numeroParcelas (int),
  categoria, formaPagamento, responsavel
  -> valorParcela = valorTotal / numeroParcelas (calculado)

TetoOrcamento (orçamento por categoria e mês):
  chave "AAAA-MM", { categoria: valorTeto, ... }

ListaDeCompras:
  id, nome, itens: [
    { id, nome, categoria (Hortifruti|Açougue/Carne|Mercearia|Laticínios/Frios|
      Padaria|Bebidas|Limpeza|Higiene/Farmácia|Outros),
      quantidade (number|null), unidade (UN|KG|L|PCT|CX),
      preco (number|null), comprado (bool) }
  ]

EventoAgenda:
  id, titulo, data (YYYY-MM-DD), categoria (Mercado|Contas|Folga|Lazer)

Meta:
  id, nome, valorAtual, valorAlvo

Investimento:
  id, nome, tipo, valorAplicado, valorAtual

Config:
  diaFechamentoPadrao (int, dia de fechamento de fatura),
  fechamentosPorMes: { "AAAA-MM": diaFechamento },
  categorias (lista editável), formasPagamento (lista editável),
  categoriasAgenda (lista editável)

Categorias financeiras padrão: Moradia, Serviços Essenciais, Saúde, Educação, Transporte, Cuidados Pessoais, Alimentação, Ifood/Refeição, Lazer, Presentes & Vestuário.

Formas de pagamento padrão: Débito, Cartão de Crédito, Pix.

Categorias de agenda padrão: Mercado, Contas, Folga, Lazer.

Responsáveis: dois nomes de pessoas configuráveis + "Conjunta" (exibida na tela como "Ambas", mas salva internamente como "Conjunta" — é apenas um rótulo informativo de "de quem é esse gasto", não divide o valor).

4. REGRAS DE NEGÓCIO / CÁLCULOS (implementar exatamente assim)

Parcela vigente em um mês (m, y): calcule a posição da parcela a partir da data da compra: posicao = (anoAlvo*12+mesAlvo) - (anoCompra*12+mesCompra) + 1. A parcela está ativa nesse mês somente se 1 <= posicao <= numeroParcelas. Quando ativa, o valor mensal é valorTotal / numeroParcelas, e é possível mostrar "parcela X/N, faltam Y".

Custo fixo ativo no mês: ativo se o índice do mês (0=Janeiro...11=Dezembro) estiver na lista mesesAtivos daquele custo fixo.

Total do mês = soma dos lançamentos à vista daquele mês + soma das parcelas vigentes daquele mês + soma dos custos fixos ativos daquele mês.

Vencendo em breve (mostrado na Visão Geral): custos fixos ativos no mês atual cujo diaVencimento - diaAtual esteja entre 0 e 5 dias, ordenados por proximidade. Mostrar selo "VENCE HOJE" (0 dias), "VENCE AMANHÃ" (1 dia) ou "EM X DIAS".

Dia de fechamento de fatura: cada mês pode ter um dia de fechamento específico (fechamentosPorMes["AAAA-MM"]); se não houver, usar o diaFechamentoPadrao (padrão geral configurável).

Faturas (extrato por forma de pagamento): para a forma de pagamento selecionada e mês selecionado, listar (a) lançamentos à vista daquele mês com aquela forma de pagamento, (b) parcelas vigentes daquele mês com aquela forma de pagamento, (c) custos fixos ativos daquele mês com aquela forma de pagamento — e somar tudo no total da fatura.

Orçamento/Teto por categoria: comparar o gasto real da categoria no mês (calculado como acima) contra o teto definido; barra de progresso verde até 100%, vira vermelha quando ultrapassa o teto.

Subtotal de item de compra: se unidade = KG, subtotal = preco_por_kg * quantidade_em_kg; senão, subtotal = preco_unitario * (quantidade || 1). A unidade padrão é KG para categorias "Hortifruti" e "Açougue/Carne", e UN para as demais (auto-preenchida ao escolher a categoria, mas o usuário pode trocar via chips UN/KG/L/PCT/CX).

Calendário (heatmap): cada dia do mês mostra a soma de tudo que caiu naquele dia (lançamentos daquela data específica); aplique 4 níveis de intensidade de cor de fundo (verde clarinho → verde forte) proporcionalmente ao valor gasto naquele dia comparado ao maior dia do mês. O dia de hoje ganha um contorno âmbar. Clicar em um dia abre um modal para ver/adicionar/editar/excluir lançamentos daquele dia específico.

5. DETALHE DE CADA SEÇÃO

5.1 Visão Geral

Painel de alerta amarelo "Vencendo em breve" (só aparece se houver itens), listando custo fixo + valor + selo de urgência.

4 cards de KPI: Total do mês, À vista, Parcelados (parcela vigente), Custos fixos.

Gráfico de linha "Tendência anual": total gasto em cada um dos 12 meses do ano selecionado.

Gráfico de rosca/pizza "Gastos por categoria" do mês.

Gráfico "Fixo vs Parcelado vs À vista" do mês (rosca ou barras).

Bloco com 3 cards: total gasto por cada responsável + total "conjunta"/ambas (rótulo informativo).

Gráfico "Gastos por responsável".

Lista das 5 maiores categorias do mês (ordenadas por valor decrescente).

Lista dos próximos 4 eventos futuros da agenda.

Card de progresso da primeira meta cadastrada (barra de progresso valorAtual/valorAlvo).

5.2 Calendário

Grade de 7 colunas (dias da semana) mostrando o mês inteiro, com heatmap de gasto por dia conforme a regra acima. Clique em um dia abre modal de lançamentos daquele dia.

5.3 Fluxo Mensal

Formulário para adicionar lançamento (data, descrição, valor, categoria, forma de pagamento, responsável) + lista de todos os lançamentos à vista do mês selecionado, com edição/exclusão inline e total do período no topo.

5.4 Orçamento Mensal

Para cada categoria, permitir definir um valor de teto para o mês selecionado, mostrando barra de progresso do gasto real vs. teto (vira vermelha ao estourar).

5.5 Custos Fixos

Formulário (descrição, valor, categoria, forma de pagamento, dia de vencimento, checkboxes dos 12 meses em que está ativo, responsável) + lista com edição/exclusão. Mostrar todos os custos fixos cadastrados (não filtrado por mês na listagem principal, mas indicando quais meses cada um está ativo).

5.6 Parcelados

Formulário (descrição, data da compra, valor total, número de parcelas — mostra o valor da parcela calculado automaticamente ao digitar, categoria, forma de pagamento, responsável) + lista de todos os parcelados cadastrados, indicando quantas parcelas já passaram / faltam a partir do mês selecionado.

5.7 Faturas

Seletor de forma de pagamento (dropdown) + mês selecionado. Mostra: card de total da fatura, lista de lançamentos à vista naquela forma de pagamento no mês, lista de parcelas vigentes naquela forma de pagamento no mês (com "parcela X/N"), lista de custos fixos ativos naquela forma de pagamento no mês. Mostrar o dia de fechamento vigente daquele mês no subtítulo.

5.8 Lista de Compras

Suporte a múltiplas listas nomeadas (ex.: "Lista Principal", "Churrasco", etc.) — painel lateral/topo para criar, selecionar e excluir listas. Dentro da lista ativa: adicionar itens com nome + categoria (categorias de compra específicas, diferentes das financeiras) + quantidade com stepper (botões +/−) + chips de unidade (UN/KG/L/PACOTE/CAIXA) + checkbox "comprado" (marca com texto riscado quando concluído).

5.9 Modo Mercado

Mesma lógica da Lista de Compras, mas otimizado para uso com uma mão só andando pelo mercado: checkboxes e textos maiores (alvo de toque grande), e adiciona um campo de preço por item, calculando subtotal em tempo real (conforme regra do item 4) e somando um total geral da lista conforme os itens vão sendo marcados/preenchidos.

5.10 Agenda

Formulário (título, data, categoria) + lista de eventos ordenada por data, permitindo editar/excluir.

5.11 Metas

Formulário (nome, valor atual, valor alvo) + lista de metas, cada uma com barra de progresso percentual (valorAtual/valorAlvo).

5.12 Investimentos

Formulário (nome, tipo, valor aplicado, valor atual) + lista mostrando a rentabilidade/diferença (valorAtual − valorAplicado) de cada investimento, com cor verde se positivo e vermelha se negativo.

5.13 Configurações

Campo para dia de fechamento padrão da fatura (número 1-31) + opção de definir uma exceção de dia de fechamento para o mês atualmente selecionado.

Três listas editáveis via "chips" com botão de adicionar e "x" para remover: Categorias financeiras, Formas de pagamento, Categorias da agenda.

Botão "Exportar Excel": gera um arquivo .xlsx com uma aba para cada: Lançamentos, Custos Fixos, Parcelados, Metas, Investimentos (cada aba com as colunas relevantes daquela entidade).

Botão "Exportar CSV" dos lançamentos (Data, Descrição, Valor, Categoria, Forma de Pagamento, Responsável).

Botão "Exportar Backup completo (JSON)" com todos os dados do app.

Botão "Importar CSV de lançamentos" (input de arquivo).

Botão "Importar Backup (JSON)" (input de arquivo, com confirmação antes de sobrescrever tudo).

Botão "Resetar tudo" (apaga todos os dados, pede confirmação antes).

6. COMPORTAMENTO TÉCNICO

App de página única (SPA): trocar de seção deve atualizar apenas o conteúdo principal, sem recarregar a página, com uma pequena animação de fade/slide-up ao entrar em uma seção.

Persistência automática: todo dado deve ser salvo automaticamente assim que criado/editado/excluído (sem precisar de botão "salvar" explícito). Se o app suportar apenas armazenamento local do navegador, use isso; se suportar backend/banco de dados, use isso — mas o importante é que os dados sobrevivam a fechar e reabrir o app.

Modais para criar/editar registros (fundo escurecido + card central), fechando ao clicar fora ou pressionar Esc.

Toda exclusão deve pedir confirmação antes.

Formatação de valores em Real brasileiro (R$ 1.234,56) e datas em formato brasileiro (DD/MM/AAAA) em toda a interface.

Gráficos (linha, rosca/pizza, barras) nas seções Visão Geral e Orçamento.

Totalmente responsivo: sidebar vira bottom-nav no mobile, grids de 2 colunas viram 1 coluna, formulário da Lista de Compras/Modo Mercado reorganiza os campos em telas pequenas (empilhados verticalmente).

7. ENTREGÁVEL

Um app funcional, completo, com as 13 seções acima navegáveis, dados de exemplo mínimos (pode nascer vazio, com listas de categorias padrão pré-carregadas), pronto para uso real de controle financeiro doméstico compartilhado entre duas pessoas.

Nome do app: MULTICAP Idioma: Português do Brasil, com toda a interface em CAIXA ALTA como estilo visual.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://multicap-financas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/afb4c94f-d9a7-4586-95f5-9e9c8367c6ae).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
