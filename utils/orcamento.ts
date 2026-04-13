import { Gasto, Orcamento } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORCAMENTO_KEY = 'orcamento:';

export async function salvarOrcamento(orcamento: Orcamento): Promise<void> {
  try {
    await AsyncStorage.setItem(`${ORCAMENTO_KEY}${orcamento.mes}`, JSON.stringify(orcamento));
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    throw error;
  }
}

export async function carregarOrcamento(mes: string): Promise<Orcamento | null> {
  try {
    const data = await AsyncStorage.getItem(`${ORCAMENTO_KEY}${mes}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar orçamento:', error);
    return null;
  }
}

export async function carregarTodosOrcamentos(): Promise<Orcamento[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const orcamentoKeys = keys.filter(key => key.startsWith(ORCAMENTO_KEY));
    
    if (orcamentoKeys.length === 0) return [];

    const orcamentosArray = await AsyncStorage.multiGet(orcamentoKeys);
    return orcamentosArray
      .map(([key, value]) => (value ? JSON.parse(value) : null))
      .filter((o): o is Orcamento => o !== null);
  } catch (error) {
    console.error('Erro ao carregar orçamentos:', error);
    return [];
  }
}

export function calcularGastoPorCategoria(gastos: Gasto[]): { [categoria: string]: number } {
  const porCategoria: { [categoria: string]: number } = {};
  
  gastos.forEach(gasto => {
    if (!porCategoria[gasto.tipo]) {
      porCategoria[gasto.tipo] = 0;
    }
    porCategoria[gasto.tipo] += gasto.valor;
  });

  return porCategoria;
}

export function verificarLimiteOrcamento(
  orcamento: Orcamento,
  gastos: Gasto[]
): {
  totalUsado: number;
  totalDisponivel: number;
  porcentagemUsada: number;
  porCategoria: { [categoria: string]: { usado: number; limite: number; porcentagem: number } };
  alerta: boolean;
} {
  const gastosPorCategoria = calcularGastoPorCategoria(gastos);
  const totalUsado = Object.values(gastosPorCategoria).reduce((sum, val) => sum + val, 0);
  const totalDisponivel = orcamento.valorTotal;
  const porcentagemUsada = totalDisponivel > 0 ? (totalUsado / totalDisponivel) * 100 : 0;
  const alerta = porcentagemUsada >= 80;

  const porCategoria: { [categoria: string]: { usado: number; limite: number; porcentagem: number } } = {};
  
  Object.keys(orcamento.porCategoria).forEach(categoria => {
    const usado = gastosPorCategoria[categoria] || 0;
    const limite = orcamento.porCategoria[categoria] || 0;
    const porcentagem = limite > 0 ? (usado / limite) * 100 : 0;
    porCategoria[categoria] = { usado, limite, porcentagem };
  });

  return {
    totalUsado,
    totalDisponivel,
    porcentagemUsada,
    porCategoria,
    alerta
  };
}

export function obterMesAtual(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

