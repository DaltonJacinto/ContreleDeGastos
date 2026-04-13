import { Gasto, Receita } from '@/types';

export interface EstatisticasCategoria {
  categoria: string;
  total: number;
  quantidade: number;
  porcentagem: number;
  cor: string;
  emoji: string;
}

export interface EstatisticasPeriodo {
  total: number;
  media: number;
  maior: Gasto | null;
  menor: Gasto | null;
  quantidade: number;
}

export function calcularEstatisticasPorCategoria(
  gastos: Gasto[],
  tiposGasto: { nome: string; cor: string; emoji: string }[]
): EstatisticasCategoria[] {
  const totais: { [key: string]: { total: number; quantidade: number; cor: string; emoji: string } } = {};

  gastos.forEach(gasto => {
    const tipo = tiposGasto.find(t => t.nome === gasto.tipo) || tiposGasto[tiposGasto.length - 1];
    if (!totais[gasto.tipo]) {
      totais[gasto.tipo] = {
        total: 0,
        quantidade: 0,
        cor: tipo.cor,
        emoji: tipo.emoji
      };
    }
    totais[gasto.tipo].total += gasto.valor;
    totais[gasto.tipo].quantidade += 1;
  });

  const totalGeral = Object.values(totais).reduce((sum, item) => sum + item.total, 0);

  return Object.entries(totais)
    .map(([categoria, dados]) => ({
      categoria,
      total: dados.total,
      quantidade: dados.quantidade,
      porcentagem: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0,
      cor: dados.cor,
      emoji: dados.emoji
    }))
    .sort((a, b) => b.total - a.total);
}

export function calcularEstatisticasPeriodo(gastos: Gasto[]): EstatisticasPeriodo {
  if (gastos.length === 0) {
    return {
      total: 0,
      media: 0,
      maior: null,
      menor: null,
      quantidade: 0
    };
  }

  const total = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
  const media = total / gastos.length;
  const maior = gastos.reduce((max, gasto) => (gasto.valor > max.valor ? gasto : max), gastos[0]);
  const menor = gastos.reduce((min, gasto) => (gasto.valor < min.valor ? gasto : min), gastos[0]);

  return {
    total,
    media,
    maior,
    menor,
    quantidade: gastos.length
  };
}

export function calcularEvolucaoTemporal(gastos: Gasto[]): { data: string; total: number }[] {
  const porData: { [key: string]: number } = {};

  gastos.forEach(gasto => {
    const data = gasto.data;
    if (!porData[data]) {
      porData[data] = 0;
    }
    porData[data] += gasto.valor;
  });

  return Object.entries(porData)
    .map(([data, total]) => ({ data, total }))
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

export function calcularSaldo(receitas: Receita[], gastos: Gasto[]): number {
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
  return totalReceitas - totalGastos;
}

export function calcularMediaDiaria(gastos: Gasto[]): number {
  if (gastos.length === 0) return 0;
  const total = gastos.reduce((sum, g) => sum + g.valor, 0);
  const dias = new Set(gastos.map(g => g.data)).size;
  return dias > 0 ? total / dias : 0;
}

export function calcularMediaSemanal(gastos: Gasto[]): number {
  if (gastos.length === 0) return 0;
  const total = gastos.reduce((sum, g) => sum + g.valor, 0);
  const semanas = Math.ceil(gastos.length / 7);
  return semanas > 0 ? total / semanas : 0;
}

export function calcularMediaMensal(gastos: Gasto[]): number {
  if (gastos.length === 0) return 0;
  const total = gastos.reduce((sum, g) => sum + g.valor, 0);
  const meses = new Set(gastos.map(g => g.data.substring(0, 7))).size;
  return meses > 0 ? total / meses : 0;
}

