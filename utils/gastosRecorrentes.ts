import { Gasto } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function processarGastosRecorrentes(): Promise<Gasto[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const gastoKeys = keys.filter(key => key.startsWith('gasto:'));
    
    if (gastoKeys.length === 0) return [];

    const gastosArray = await AsyncStorage.multiGet(gastoKeys);
    const gastos: Gasto[] = gastosArray
      .map(([key, value]) => (value ? JSON.parse(value) : null))
      .filter((g): g is Gasto => g !== null && g.recorrente?.ativo);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const novosGastos: Gasto[] = [];

    for (const gasto of gastos) {
      if (!gasto.recorrente || !gasto.recorrente.proximaData) continue;

      const proximaData = new Date(gasto.recorrente.proximaData);
      proximaData.setHours(0, 0, 0, 0);

      // Se a próxima data já passou, criar novo gasto
      if (proximaData <= hoje) {
        const novoGasto: Gasto = {
          ...gasto,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          data: proximaData.toISOString().split('T')[0],
          dataCriacao: new Date().toISOString()
        };

        // Calcular próxima data
        const proximaDataCalculada = calcularProximaData(proximaData, gasto.recorrente.frequencia);
        novoGasto.recorrente = {
          ...gasto.recorrente,
          proximaData: proximaDataCalculada.toISOString().split('T')[0]
        };

        // Salvar novo gasto
        await AsyncStorage.setItem(`gasto:${novoGasto.id}`, JSON.stringify(novoGasto));
        
        // Atualizar gasto original com nova próxima data
        gasto.recorrente.proximaData = proximaDataCalculada.toISOString().split('T')[0];
        await AsyncStorage.setItem(`gasto:${gasto.id}`, JSON.stringify(gasto));

        novosGastos.push(novoGasto);
      }
    }

    return novosGastos;
  } catch (error) {
    console.error('Erro ao processar gastos recorrentes:', error);
    return [];
  }
}

function calcularProximaData(dataAtual: Date, frequencia: 'diario' | 'semanal' | 'mensal'): Date {
  const proxima = new Date(dataAtual);

  switch (frequencia) {
    case 'diario':
      proxima.setDate(proxima.getDate() + 1);
      break;
    case 'semanal':
      proxima.setDate(proxima.getDate() + 7);
      break;
    case 'mensal':
      proxima.setMonth(proxima.getMonth() + 1);
      break;
  }

  return proxima;
}

export function calcularProximaDataRecorrente(
  dataBase: string,
  frequencia: 'diario' | 'semanal' | 'mensal'
): string {
  const data = new Date(dataBase);
  const proxima = calcularProximaData(data, frequencia);
  return proxima.toISOString().split('T')[0];
}

