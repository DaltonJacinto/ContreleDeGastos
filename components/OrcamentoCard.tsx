import { Gasto, Orcamento } from '@/types';
import { verificarLimiteOrcamento } from '@/utils/orcamento';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrcamentoCardProps {
  orcamento: Orcamento;
  gastos: Gasto[];
  onEditar: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;

export default function OrcamentoCard({ orcamento, gastos, onEditar }: OrcamentoCardProps) {
  const status = verificarLimiteOrcamento(orcamento, gastos);

  const formatarMoeda = (valor: number): string => {
    return `${valor.toFixed(2).replace('.', ',')} MT`;
  };

  const getCorProgresso = (): string => {
    if (status.porcentagemUsada >= 100) return '#ef4444';
    if (status.porcentagemUsada >= 80) return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Orçamento Mensal</Text>
          <Text style={styles.mes}>{orcamento.mes}</Text>
        </View>
        {status.alerta && (
          <View style={styles.alertaBadge}>
            <Text style={styles.alertaTexto}>⚠️ Alerta</Text>
          </View>
        )}
      </View>

      <View style={styles.progressoContainer}>
        <View style={styles.progressoHeader}>
          <Text style={styles.progressoLabel}>Gasto</Text>
          <Text style={styles.progressoValor}>
            {formatarMoeda(status.totalUsado)} / {formatarMoeda(status.totalDisponivel)}
          </Text>
        </View>
        <View style={styles.barraProgresso}>
          <View
            style={[
              styles.barraPreenchida,
              {
                width: `${Math.min(status.porcentagemUsada, 100)}%`,
                backgroundColor: getCorProgresso()
              }
            ]}
          />
        </View>
        <Text style={styles.porcentagem}>
          {status.porcentagemUsada.toFixed(1)}% utilizado
        </Text>
      </View>

      {Object.keys(status.porCategoria).length > 0 && (
        <View style={styles.categoriasContainer}>
          <Text style={styles.categoriasTitulo}>Por Categoria:</Text>
          {Object.entries(status.porCategoria).map(([categoria, dados]) => (
            <View key={categoria} style={styles.categoriaItem}>
              <Text style={styles.categoriaNome}>{categoria}</Text>
              <View style={styles.categoriaProgresso}>
                <View style={styles.barraProgressoPequena}>
                  <View
                    style={[
                      styles.barraPreenchidaPequena,
                      {
                        width: `${Math.min(dados.porcentagem, 100)}%`,
                        backgroundColor: dados.porcentagem >= 100 ? '#ef4444' :
                                       dados.porcentagem >= 80 ? '#f59e0b' : '#10b981'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.categoriaValor}>
                  {formatarMoeda(dados.usado)} / {formatarMoeda(dados.limite)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.botaoEditar} onPress={onEditar}>
        <Text style={styles.textoBotaoEditar}>✏️ Editar Orçamento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 16 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  titulo: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#065f46'
  },
  mes: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  alertaBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  alertaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e'
  },
  progressoContainer: {
    marginBottom: 16
  },
  progressoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  progressoValor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  barraProgresso: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4
  },
  barraPreenchida: {
    height: '100%',
    borderRadius: 6
  },
  porcentagem: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right'
  },
  categoriasContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  categoriasTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12
  },
  categoriaItem: {
    marginBottom: 12
  },
  categoriaNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4
  },
  categoriaProgresso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  barraProgressoPequena: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden'
  },
  barraPreenchidaPequena: {
    height: '100%',
    borderRadius: 3
  },
  categoriaValor: {
    fontSize: 11,
    color: '#6b7280',
    minWidth: 100,
    textAlign: 'right'
  },
  botaoEditar: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    alignItems: 'center'
  },
  textoBotaoEditar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af'
  }
});

