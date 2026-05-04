export type TipoLancamento = 'entrada' | 'saida';
export type StatusFixa = 'ativa' | 'pausada' | 'encerrada';

export type ClasseInvestimento =
  | 'renda_fixa' | 'acoes' | 'fiis' | 'cripto' | 'internacional' | 'outros';

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  icone: string;
  cor: string;
  orcamento: number | null;
  createdAt: string;
}

export interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  data: string;
  categoriaId: string;
  tags: string | null;
  parcelas: number | null;
  parcelaAtual: number | null;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
}

export interface DespesaFixa {
  id: string;
  descricao: string;
  valor: number;
  diaVencimento: number;
  categoriaId: string;
  dataInicio: string;
  dataFim: string | null;
  status: StatusFixa;
  createdAt: string;
  updatedAt: string;
  categoria?: Categoria;
}

export interface HistoricoValor {
  id: string;
  despesaFixaId: string;
  valor: number;
  dataAlteracao: string;
}

// ── Categorias de investimento (livre, criado pelo usuário) ─────────────────

export interface CategoriaInvestimento {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  createdAt: string;
  updatedAt: string;
}

// ── Rendimento registrado por mês ───────────────────────────────────────────

export interface RendimentoMensal {
  id: string;
  categoriaInvestimentoId: string;
  ano: number;
  mes: number;           // 1–12
  valorRendimento: number | null;  // R$ absoluto
  percentual: number | null;       // % no período
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
  categoriaInvestimento?: CategoriaInvestimento;
}

// ── Investimento (aporte) ───────────────────────────────────────────────────

export interface Investimento {
  id: string;
  descricao: string;
  valor: number;
  quantidadeBTC?: number | null;
  classe?: string | null;                       // legado
  categoriaInvestimentoId?: string | null;
  categoriaInvestimento?: CategoriaInvestimento | null;
  data: string;
  createdAt: string;
}

// ── Legado (mantido para compatibilidade) ───────────────────────────────────

export const CLASSES_INVESTIMENTO: { value: ClasseInvestimento; label: string; cor: string; icone: string }[] = [
  { value: 'renda_fixa',    label: 'Renda Fixa',     cor: '#34d399', icone: 'Landmark' },
  { value: 'acoes',         label: 'Ações',           cor: '#3b82f6', icone: 'TrendingUp' },
  { value: 'fiis',          label: 'FIIs',            cor: '#a5b4fc', icone: 'Building2' },
  { value: 'cripto',        label: 'Criptomoedas',   cor: '#f59e0b', icone: 'Bitcoin' },
  { value: 'internacional', label: 'Internacional',   cor: '#22d3ee', icone: 'Globe' },
  { value: 'outros',        label: 'Outros',          cor: '#94a3b8', icone: 'MoreHorizontal' },
];
