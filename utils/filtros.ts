import { Filtros, Gasto } from '@/types';

export function filtrarGastos(gastos: Gasto[], filtros: Filtros): Gasto[] {
  let resultado = [...gastos];

  // Busca por descrição
  if (filtros.busca && filtros.busca.trim()) {
    const buscaLower = filtros.busca.toLowerCase();
    resultado = resultado.filter(gasto =>
      gasto.descricao.toLowerCase().includes(buscaLower) ||
      gasto.tipo.toLowerCase().includes(buscaLower)
    );
  }

  // Filtro por tipo
  if (filtros.tipo) {
    resultado = resultado.filter(gasto => gasto.tipo === filtros.tipo);
  }

  // Filtro por período
  if (filtros.periodo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (filtros.periodo) {
      case 'hoje':
        resultado = resultado.filter(gasto => {
          const dataGasto = new Date(gasto.data);
          dataGasto.setHours(0, 0, 0, 0);
          return dataGasto.getTime() === hoje.getTime();
        });
        break;

      case 'semana': {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        resultado = resultado.filter(gasto => {
          const dataGasto = new Date(gasto.data);
          return dataGasto >= inicioSemana && dataGasto <= hoje;
        });
        break;
      }

      case 'mes': {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        resultado = resultado.filter(gasto => {
          const dataGasto = new Date(gasto.data);
          return dataGasto >= inicioMes && dataGasto <= hoje;
        });
        break;
      }

      case 'ano': {
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        resultado = resultado.filter(gasto => {
          const dataGasto = new Date(gasto.data);
          return dataGasto >= inicioAno && dataGasto <= hoje;
        });
        break;
      }

      case 'personalizado':
        if (filtros.dataInicio && filtros.dataFim) {
          const inicio = new Date(filtros.dataInicio);
          const fim = new Date(filtros.dataFim);
          fim.setHours(23, 59, 59, 999);
          resultado = resultado.filter(gasto => {
            const dataGasto = new Date(gasto.data);
            return dataGasto >= inicio && dataGasto <= fim;
          });
        }
        break;
    }
  }

  // Filtro por valor
  if (filtros.valorMinimo !== undefined) {
    resultado = resultado.filter(gasto => gasto.valor >= filtros.valorMinimo!);
  }
  if (filtros.valorMaximo !== undefined) {
    resultado = resultado.filter(gasto => gasto.valor <= filtros.valorMaximo!);
  }

  // Ordenação
  if (filtros.ordenacao) {
    resultado.sort((a, b) => {
      let comparacao = 0;

      switch (filtros.ordenacao) {
        case 'data':
          comparacao = new Date(a.data).getTime() - new Date(b.data).getTime();
          break;
        case 'valor':
          comparacao = a.valor - b.valor;
          break;
        case 'tipo':
          comparacao = a.tipo.localeCompare(b.tipo);
          break;
      }

      return filtros.ordem === 'asc' ? comparacao : -comparacao;
    });
  } else {
    // Ordenação padrão por data (mais recente primeiro)
    resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  return resultado;
}

