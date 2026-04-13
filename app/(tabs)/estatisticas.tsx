import GraficoLinha from '@/components/GraficoLinha';
import GraficoPizza from '@/components/GraficoPizza';
import { Gasto, Receita, TIPOS_GASTO } from '@/types';
import {
    calcularEstatisticasPeriodo,
    calcularEstatisticasPorCategoria,
    calcularEvolucaoTemporal,
    calcularMediaDiaria,
    calcularMediaMensal,
    calcularMediaSemanal,
    calcularSaldo
} from '@/utils/estatisticas';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;

export default function EstatisticasScreen() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'todos' | 'mes' | 'ano'>('todos');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar gastos
      const keys = await AsyncStorage.getAllKeys();
      const gastoKeys = keys.filter(key => key.startsWith('gasto:'));
      const receitaKeys = keys.filter(key => key.startsWith('receita:'));

      if (gastoKeys.length > 0) {
        const gastosArray = await AsyncStorage.multiGet(gastoKeys);
        const gastosCarregados: Gasto[] = gastosArray
          .map(([key, value]) => (value ? JSON.parse(value) : null))
          .filter((g): g is Gasto => g !== null);
        setGastos(gastosCarregados);
      }

      if (receitaKeys.length > 0) {
        const receitasArray = await AsyncStorage.multiGet(receitaKeys);
        const receitasCarregadas: Receita[] = receitasArray
          .map(([key, value]) => (value ? JSON.parse(value) : null))
          .filter((r): r is Receita => r !== null);
        setReceitas(receitasCarregadas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const filtrarPorPeriodo = (dados: Gasto[] | Receita[]): Gasto[] | Receita[] => {
    if (periodoSelecionado === 'todos') return dados;

    const hoje = new Date();
    const inicio = new Date();

    if (periodoSelecionado === 'mes') {
      inicio.setMonth(hoje.getMonth());
      inicio.setDate(1);
    } else if (periodoSelecionado === 'ano') {
      inicio.setFullYear(hoje.getFullYear());
      inicio.setMonth(0);
      inicio.setDate(1);
    }

    return dados.filter(item => {
      const dataItem = new Date(item.data);
      return dataItem >= inicio && dataItem <= hoje;
    });
  };

  const gastosFiltrados = filtrarPorPeriodo(gastos) as Gasto[];
  const receitasFiltradas = filtrarPorPeriodo(receitas) as Receita[];

  const statsCategoria = calcularEstatisticasPorCategoria(gastosFiltrados, TIPOS_GASTO);
  const statsPeriodo = calcularEstatisticasPeriodo(gastosFiltrados);
  const evolucao = calcularEvolucaoTemporal(gastosFiltrados);
  const saldo = calcularSaldo(receitasFiltradas, gastosFiltrados);
  const mediaDiaria = calcularMediaDiaria(gastosFiltrados);
  const mediaSemanal = calcularMediaSemanal(gastosFiltrados);
  const mediaMensal = calcularMediaMensal(gastosFiltrados);

  const formatarMoeda = (valor: number): string => {
    return `${valor.toFixed(2).replace('.', ',')} MT`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.containerInterno}>
          {/* Header */}
          <View style={styles.cardBranco}>
            <Text style={styles.titulo}>📊 Estatísticas</Text>
            
            {/* Filtros de período */}
            <View style={styles.filtrosPeriodo}>
              {(['todos', 'mes', 'ano'] as const).map((periodo) => (
                <TouchableOpacity
                  key={periodo}
                  style={[
                    styles.botaoPeriodo,
                    periodoSelecionado === periodo && styles.botaoPeriodoSelecionado
                  ]}
                  onPress={() => setPeriodoSelecionado(periodo)}
                >
                  <Text
                    style={[
                      styles.textoPeriodo,
                      periodoSelecionado === periodo && styles.textoPeriodoSelecionado
                    ]}
                  >
                    {periodo === 'todos' ? 'Todos' : periodo === 'mes' ? 'Este Mês' : 'Este Ano'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Saldo */}
          <View style={styles.cardBranco}>
            <View style={styles.cardSaldo}>
              <Text style={styles.saldoLabel}>Saldo Total</Text>
              <Text style={[styles.saldoValor, { color: saldo >= 0 ? '#10b981' : '#ef4444' }]}>
                {formatarMoeda(saldo)}
              </Text>
              <View style={styles.saldoDetalhes}>
                <View style={styles.saldoItem}>
                  <Text style={styles.saldoItemLabel}>Receitas</Text>
                  <Text style={styles.saldoItemValor}>
                    {formatarMoeda(receitasFiltradas.reduce((sum, r) => sum + r.valor, 0))}
                  </Text>
                </View>
                <View style={styles.saldoItem}>
                  <Text style={styles.saldoItemLabel}>Gastos</Text>
                  <Text style={styles.saldoItemValor}>
                    {formatarMoeda(gastosFiltrados.reduce((sum, g) => sum + g.valor, 0))}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Estatísticas Gerais */}
          <View style={styles.cardBranco}>
            <Text style={styles.subtitulo}>📈 Resumo Geral</Text>
            <View style={styles.gridEstatisticas}>
              <View style={styles.cardEstatistica}>
                <Text style={styles.estatisticaValor}>{formatarMoeda(statsPeriodo.total)}</Text>
                <Text style={styles.estatisticaLabel}>Total Gasto</Text>
              </View>
              <View style={styles.cardEstatistica}>
                <Text style={styles.estatisticaValor}>{statsPeriodo.quantidade}</Text>
                <Text style={styles.estatisticaLabel}>Quantidade</Text>
              </View>
              <View style={styles.cardEstatistica}>
                <Text style={styles.estatisticaValor}>{formatarMoeda(statsPeriodo.media)}</Text>
                <Text style={styles.estatisticaLabel}>Média</Text>
              </View>
              {statsPeriodo.maior && (
                <View style={styles.cardEstatistica}>
                  <Text style={styles.estatisticaValor}>{formatarMoeda(statsPeriodo.maior.valor)}</Text>
                  <Text style={styles.estatisticaLabel}>Maior Gasto</Text>
                </View>
              )}
              {statsPeriodo.menor && (
                <View style={styles.cardEstatistica}>
                  <Text style={styles.estatisticaValor}>{formatarMoeda(statsPeriodo.menor.valor)}</Text>
                  <Text style={styles.estatisticaLabel}>Menor Gasto</Text>
                </View>
              )}
            </View>
          </View>

          {/* Médias */}
          <View style={styles.cardBranco}>
            <Text style={styles.subtitulo}>📊 Médias</Text>
            <View style={styles.gridMedias}>
              <View style={styles.cardMedia}>
                <Text style={styles.mediaValor}>{formatarMoeda(mediaDiaria)}</Text>
                <Text style={styles.mediaLabel}>Média Diária</Text>
              </View>
              <View style={styles.cardMedia}>
                <Text style={styles.mediaValor}>{formatarMoeda(mediaSemanal)}</Text>
                <Text style={styles.mediaLabel}>Média Semanal</Text>
              </View>
              <View style={styles.cardMedia}>
                <Text style={styles.mediaValor}>{formatarMoeda(mediaMensal)}</Text>
                <Text style={styles.mediaLabel}>Média Mensal</Text>
              </View>
            </View>
          </View>

          {/* Gráfico Pizza */}
          {statsCategoria.length > 0 && (
            <View style={styles.cardBranco}>
              <Text style={styles.subtitulo}>🥧 Gastos por Categoria</Text>
              <GraficoPizza dados={statsCategoria} />
            </View>
          )}

          {/* Gráfico Linha */}
          {evolucao.length > 0 && (
            <View style={styles.cardBranco}>
              <Text style={styles.subtitulo}>📈 Evolução Temporal</Text>
              <GraficoLinha dados={evolucao} />
            </View>
          )}

          {/* Detalhes por Categoria */}
          {statsCategoria.length > 0 && (
            <View style={styles.cardBranco}>
              <Text style={styles.subtitulo}>📋 Detalhes por Categoria</Text>
              <View style={styles.listaCategorias}>
                {statsCategoria.map((item, index) => (
                  <View key={index} style={styles.itemCategoria}>
                    <View style={[styles.quadradoCor, { backgroundColor: item.cor }]} />
                    <View style={styles.categoriaInfo}>
                      <Text style={styles.categoriaNome}>
                        {item.emoji} {item.categoria}
                      </Text>
                      <Text style={styles.categoriaDetalhes}>
                        {item.quantidade} {item.quantidade === 1 ? 'gasto' : 'gastos'} • {item.porcentagem.toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={styles.categoriaValor}>{formatarMoeda(item.total)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5'
  },
  scrollView: {
    flex: 1
  },
  containerInterno: {
    padding: isMobile ? 12 : 16
  },
  cardBranco: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 16 : 24,
    marginBottom: isMobile ? 16 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  titulo: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 16
  },
  subtitulo: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16
  },
  filtrosPeriodo: {
    flexDirection: 'row',
    gap: 8
  },
  botaoPeriodo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  botaoPeriodoSelecionado: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  textoPeriodo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  textoPeriodoSelecionado: {
    color: 'white'
  },
  cardSaldo: {
    alignItems: 'center'
  },
  saldoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8
  },
  saldoValor: {
    fontSize: isMobile ? 32 : 40,
    fontWeight: 'bold',
    marginBottom: 16
  },
  saldoDetalhes: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    justifyContent: 'center'
  },
  saldoItem: {
    alignItems: 'center'
  },
  saldoItemLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  saldoItemValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  gridEstatisticas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  cardEstatistica: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  estatisticaValor: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4
  },
  estatisticaLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },
  gridMedias: {
    flexDirection: 'row',
    gap: 12
  },
  cardMedia: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  mediaValor: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4
  },
  mediaLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },
  listaCategorias: {
    gap: 12
  },
  itemCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 10
  },
  quadradoCor: {
    width: 24,
    height: 24,
    borderRadius: 6
  },
  categoriaInfo: {
    flex: 1
  },
  categoriaNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2
  },
  categoriaDetalhes: {
    fontSize: 12,
    color: '#6b7280'
  },
  categoriaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981'
  }
});

