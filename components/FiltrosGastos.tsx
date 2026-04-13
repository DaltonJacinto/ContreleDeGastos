import { Filtros, TIPOS_GASTO } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface FiltrosGastosProps {
  filtros: Filtros;
  onFiltrosChange: (filtros: Filtros) => void;
  onClose: () => void;
  visible: boolean;
}

export default function FiltrosGastos({
  filtros,
  onFiltrosChange,
  onClose,
  visible
}: FiltrosGastosProps) {
  const [filtrosLocais, setFiltrosLocais] = useState<Filtros>(filtros);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFim, setShowDatePickerFim] = useState(false);

  const aplicarFiltros = () => {
    onFiltrosChange(filtrosLocais);
    onClose();
  };

  const limparFiltros = () => {
    const filtrosLimpos: Filtros = {};
    setFiltrosLocais(filtrosLimpos);
    onFiltrosChange(filtrosLimpos);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Filtros e Busca</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.botaoFechar}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              style={styles.conteudo}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
            {/* Busca */}
            <View style={styles.secao}>
              <Text style={styles.label}>Buscar por descrição</Text>
              <TextInput
                style={styles.input}
                value={filtrosLocais.busca || ''}
                onChangeText={(text) => setFiltrosLocais({ ...filtrosLocais, busca: text })}
                placeholder="Digite para buscar..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Tipo */}
            <View style={styles.secao}>
              <Text style={styles.label}>Tipo de Gasto</Text>
              <View style={styles.gridTipos}>
                <TouchableOpacity
                  style={[
                    styles.botaoTipo,
                    !filtrosLocais.tipo && styles.botaoTipoSelecionado
                  ]}
                  onPress={() => setFiltrosLocais({ ...filtrosLocais, tipo: undefined })}
                >
                  <Text style={styles.textoBotaoTipo}>Todos</Text>
                </TouchableOpacity>
                {TIPOS_GASTO.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.nome}
                    style={[
                      styles.botaoTipo,
                      filtrosLocais.tipo === tipo.nome && {
                        backgroundColor: tipo.cor + '20',
                        borderColor: tipo.cor
                      }
                    ]}
                    onPress={() =>
                      setFiltrosLocais({
                        ...filtrosLocais,
                        tipo: filtrosLocais.tipo === tipo.nome ? undefined : tipo.nome
                      })
                    }
                  >
                    <Text style={styles.emojiTipo}>{tipo.emoji}</Text>
                    <Text style={styles.textoTipo}>{tipo.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Período */}
            <View style={styles.secao}>
              <Text style={styles.label}>Período</Text>
              <View style={styles.gridPeriodo}>
                {(['hoje', 'semana', 'mes', 'ano', 'personalizado'] as const).map((periodo) => (
                  <TouchableOpacity
                    key={periodo}
                    style={[
                      styles.botaoPeriodo,
                      filtrosLocais.periodo === periodo && styles.botaoPeriodoSelecionado
                    ]}
                    onPress={() =>
                      setFiltrosLocais({
                        ...filtrosLocais,
                        periodo: filtrosLocais.periodo === periodo ? undefined : periodo
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.textoPeriodo,
                        filtrosLocais.periodo === periodo && styles.textoPeriodoSelecionado
                      ]}
                    >
                      {periodo === 'hoje' ? 'Hoje' :
                       periodo === 'semana' ? 'Semana' :
                       periodo === 'mes' ? 'Mês' :
                       periodo === 'ano' ? 'Ano' : 'Personalizado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filtrosLocais.periodo === 'personalizado' && (
                <View style={styles.datesContainer}>
                  <View style={styles.dateInput}>
                    <Text style={styles.labelData}>Data Início</Text>
                    <TouchableOpacity
                      style={styles.botaoData}
                      onPress={() => setShowDatePickerInicio(true)}
                    >
                      <Text>{filtrosLocais.dataInicio || 'Selecionar'}</Text>
                    </TouchableOpacity>
                    {showDatePickerInicio && (
                      <DateTimePicker
                        value={filtrosLocais.dataInicio ? new Date(filtrosLocais.dataInicio + 'T12:00:00') : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowDatePickerInicio(false);
                          }
                          if (selectedDate) {
                            setFiltrosLocais({
                              ...filtrosLocais,
                              dataInicio: selectedDate.toISOString().split('T')[0]
                            });
                            if (Platform.OS === 'ios') {
                              setShowDatePickerInicio(false);
                            }
                          } else if (Platform.OS === 'android') {
                            setShowDatePickerInicio(false);
                          }
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.dateInput}>
                    <Text style={styles.labelData}>Data Fim</Text>
                    <TouchableOpacity
                      style={styles.botaoData}
                      onPress={() => setShowDatePickerFim(true)}
                    >
                      <Text>{filtrosLocais.dataFim || 'Selecionar'}</Text>
                    </TouchableOpacity>
                    {showDatePickerFim && (
                      <DateTimePicker
                        value={filtrosLocais.dataFim ? new Date(filtrosLocais.dataFim + 'T12:00:00') : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowDatePickerFim(false);
                          }
                          if (selectedDate) {
                            setFiltrosLocais({
                              ...filtrosLocais,
                              dataFim: selectedDate.toISOString().split('T')[0]
                            });
                            if (Platform.OS === 'ios') {
                              setShowDatePickerFim(false);
                            }
                          } else if (Platform.OS === 'android') {
                            setShowDatePickerFim(false);
                          }
                        }}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Valor */}
            <View style={styles.secao}>
              <Text style={styles.label}>Valor (MZN)</Text>
              <View style={styles.valorContainer}>
                <View style={styles.valorInput}>
                  <Text style={styles.labelData}>Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.valorMinimo?.toString() || ''}
                    onChangeText={(text) =>
                      setFiltrosLocais({
                        ...filtrosLocais,
                        valorMinimo: text ? parseFloat(text) : undefined
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.valorInput}>
                  <Text style={styles.labelData}>Máximo</Text>
                  <TextInput
                    style={styles.input}
                    value={filtrosLocais.valorMaximo?.toString() || ''}
                    onChangeText={(text) =>
                      setFiltrosLocais({
                        ...filtrosLocais,
                        valorMaximo: text ? parseFloat(text) : undefined
                      })
                    }
                    keyboardType="decimal-pad"
                    placeholder="∞"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            {/* Ordenação */}
            <View style={styles.secao}>
              <Text style={styles.label}>Ordenar por</Text>
              <View style={styles.gridOrdenacao}>
                {(['data', 'valor', 'tipo'] as const).map((ordenacao) => (
                  <TouchableOpacity
                    key={ordenacao}
                    style={[
                      styles.botaoOrdenacao,
                      filtrosLocais.ordenacao === ordenacao && styles.botaoOrdenacaoSelecionado
                    ]}
                    onPress={() =>
                      setFiltrosLocais({
                        ...filtrosLocais,
                        ordenacao: filtrosLocais.ordenacao === ordenacao ? undefined : ordenacao,
                        ordem: filtrosLocais.ordenacao === ordenacao && filtrosLocais.ordem === 'asc' ? 'desc' : 'asc'
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.textoOrdenacao,
                        filtrosLocais.ordenacao === ordenacao && styles.textoOrdenacaoSelecionado
                      ]}
                    >
                      {ordenacao === 'data' ? 'Data' :
                       ordenacao === 'valor' ? 'Valor' : 'Tipo'}
                      {filtrosLocais.ordenacao === ordenacao && (
                        <Text> {filtrosLocais.ordem === 'asc' ? '↑' : '↓'}</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.botaoLimpar} onPress={limparFiltros}>
              <Text style={styles.textoBotaoLimpar}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoAplicar} onPress={aplicarFiltros}>
              <Text style={styles.textoBotaoAplicar}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46'
  },
  botaoFechar: {
    fontSize: 24,
    color: '#6b7280'
  },
  conteudo: {
    padding: 20
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  secao: {
    marginBottom: 24
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  gridTipos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  botaoTipo: {
    width: '30%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  botaoTipoSelecionado: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981'
  },
  emojiTipo: {
    fontSize: 24,
    marginBottom: 4
  },
  textoTipo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  textoBotaoTipo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  gridPeriodo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  datesContainer: {
    marginTop: 12,
    gap: 12
  },
  dateInput: {
    gap: 8
  },
  labelData: {
    fontSize: 12,
    color: '#6b7280'
  },
  botaoData: {
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'white'
  },
  valorContainer: {
    flexDirection: 'row',
    gap: 12
  },
  valorInput: {
    flex: 1,
    gap: 8
  },
  gridOrdenacao: {
    flexDirection: 'row',
    gap: 8
  },
  botaoOrdenacao: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center'
  },
  botaoOrdenacaoSelecionado: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  textoOrdenacao: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  textoOrdenacaoSelecionado: {
    color: 'white'
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  botaoLimpar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  textoBotaoLimpar: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16
  },
  botaoAplicar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center'
  },
  textoBotaoAplicar: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});

