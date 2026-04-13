// Tipos e interfaces do sistema de controle de gastos

export interface TipoGasto {
  nome: string;
  emoji: string;
  cor: string;
}

export interface TipoReceita {
  nome: string;
  emoji: string;
  cor: string;
}

export interface Gasto {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  descricao: string;
  dataCriacao: string;
  recorrente?: {
    ativo: boolean;
    frequencia: 'diario' | 'semanal' | 'mensal';
    proximaData?: string;
  };
}

export interface Receita {
  id: string;
  tipo: string;
  valor: number;
  data: string;
  descricao: string;
  dataCriacao: string;
}

export interface Orcamento {
  id: string;
  mes: string; // formato YYYY-MM
  valorTotal: number;
  porCategoria: { [categoria: string]: number };
  dataCriacao: string;
}

export interface Filtros {
  busca?: string;
  tipo?: string;
  periodo?: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ordenacao?: 'data' | 'valor' | 'tipo';
  ordem?: 'asc' | 'desc';
}

export const TIPOS_GASTO: TipoGasto[] = [
  { nome: 'Alimentação', emoji: '☕', cor: '#f97316' },
  { nome: 'Transporte', emoji: '🚗', cor: '#3b82f6' },
  { nome: 'Moradia', emoji: '🏠', cor: '#22c55e' },
  { nome: 'Compras', emoji: '🛒', cor: '#a855f7' },
  { nome: 'Saúde', emoji: '❤️', cor: '#ef4444' },
  { nome: 'Tecnologia', emoji: '📱', cor: '#6366f1' },
  { nome: 'Outros', emoji: '💵', cor: '#6b7280' }
];

export const TIPOS_RECEITA: TipoReceita[] = [
  { nome: 'Salário', emoji: '💼', cor: '#10b981' },
  { nome: 'Freelance', emoji: '💻', cor: '#3b82f6' },
  { nome: 'Investimentos', emoji: '📈', cor: '#22c55e' },
  { nome: 'Vendas', emoji: '🛍️', cor: '#a855f7' },
  { nome: 'Presentes', emoji: '🎁', cor: '#f97316' },
  { nome: 'Outros', emoji: '💰', cor: '#6b7280' }
];

