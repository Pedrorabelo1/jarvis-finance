/**
 * Default categories created automatically for every new user on signup.
 * Colors harmonize with the Bloom blue/black/white palette.
 */
export const DEFAULT_CATEGORIAS_SAIDA = [
  { nome: 'Moradia', icone: 'Home', cor: '#3b82f6', orcamento: 2500 },
  { nome: 'Alimentação', icone: 'UtensilsCrossed', cor: '#22d3ee', orcamento: 1500 },
  { nome: 'Transporte', icone: 'Car', cor: '#60a5fa', orcamento: 800 },
  { nome: 'Saúde', icone: 'Heart', cor: '#fb7185', orcamento: 600 },
  { nome: 'Educação', icone: 'GraduationCap', cor: '#a5b4fc', orcamento: 500 },
  { nome: 'Lazer', icone: 'Gamepad2', cor: '#818cf8', orcamento: 400 },
  { nome: 'Assinaturas', icone: 'Repeat', cor: '#38bdf8', orcamento: 300 },
  { nome: 'Pets', icone: 'PawPrint', cor: '#93c5fd', orcamento: 200 },
  { nome: 'Vestuário', icone: 'ShoppingBag', cor: '#67e8f9', orcamento: 300 },
  { nome: 'Impostos', icone: 'FileText', cor: '#64748b', orcamento: null },
  { nome: 'Outros', icone: 'MoreHorizontal', cor: '#94a3b8', orcamento: null },
] as const;

export const DEFAULT_CATEGORIAS_ENTRADA = [
  { nome: 'Salário', icone: 'Briefcase', cor: '#34d399' },
  { nome: 'Freelance', icone: 'Laptop', cor: '#22d3ee' },
  { nome: 'Distribuição de Lucros', icone: 'Building2', cor: '#2dd4bf' },
  { nome: 'Aluguel Recebido', icone: 'Key', cor: '#60a5fa' },
  { nome: 'Dividendos', icone: 'TrendingUp', cor: '#a5b4fc' },
  { nome: 'Outros', icone: 'Plus', cor: '#94a3b8' },
] as const;
