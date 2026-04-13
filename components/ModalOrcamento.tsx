import { Orcamento, TIPOS_GASTO } from '@/types';
import { obterMesAtual } from '@/utils/orcamento';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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

interface ModalOrcamentoProps {
  visible: boolean;
  orcamento?: Orcamento | null;
  onSalvar: (orcamento: Orcamento) => void;
  onClose: () => void;
}

export default function ModalOrcamento({
  visible,
  orcamento,
  onSalvar,
  onClose
}: ModalOrcamentoProps) {
  const [valorTotal, setValorTotal] = useState<string>('');
  const [valoresPorCategoria, setValoresPorCategoria] = useState<{ [key: string]: string }>({});
  const [mes, setMes] = useState<string>(obterMesAtual());

  useEffect(() => {
    if (visible) {
      if (orcamento) {
        setValorTotal(orcamento.valorTotal.toString());
        setMes(orcamento.mes);
        const valores: { [key: string]: string } = {};
        Object.entries(orcamento.porCategoria).forEach(([cat, val]) => {
          valores[cat] = val.toString();
        });
        setValoresPorCategoria(valores);
      } else {
        setValorTotal('');
        setMes(obterMesAtual());
        setValoresPorCategoria({});
      }
    } else {
      // Limpar campos quando o modal fecha
      setValorTotal('');
      setMes(obterMesAtual());
      setValoresPorCategoria({});
    }
  }, [orcamento, visible]);

  const salvar = () => {
    // Validar formato do mês
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      Alert.alert('Atenção', 'Por favor, insira um mês válido no formato YYYY-MM (ex: 2024-01)!');
      return;
    }

    const valorTotalNum = parseFloat(valorTotal.replace(',', '.'));
    if (isNaN(valorTotalNum) || valorTotalNum <= 0) {
      Alert.alert('Atenção', 'Por favor, insira um valor total válido!');
      return;
    }

    const porCategoria: { [key: string]: number } = {};
    Object.entries(valoresPorCategoria).forEach(([cat, val]) => {
      if (val && val.trim()) {
        const valorNum = parseFloat(val.replace(',', '.'));
        if (!isNaN(valorNum) && valorNum > 0) {
          porCategoria[cat] = valorNum;
        }
      }
    });

    const novoOrcamento: Orcamento = {
      id: orcamento?.id || Date.now().toString(),
      mes,
      valorTotal: valorTotalNum,
      porCategoria,
      dataCriacao: orcamento?.dataCriacao || new Date().toISOString()
    };

    onSalvar(novoOrcamento);
    onClose();
  };

  const atualizarValorCategoria = (categoria: string, valor: string) => {
    setValoresPorCategoria({ ...valoresPorCategoria, [categoria]: valor });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.overlayContent}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.titulo}>
                {orcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.botaoFechar}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.conteudo}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.secao}>
                <Text style={styles.label}>Mês (YYYY-MM)</Text>
                <TextInput
                  style={styles.input}
                  value={mes}
                  onChangeText={setMes}
                  placeholder="2024-01"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.secao}>
                <Text style={styles.label}>Valor Total (MZN)</Text>
                <TextInput
                  style={styles.input}
                  value={valorTotal}
                  onChangeText={setValorTotal}
                  keyboardType="decimal-pad"
                  placeholder="5000"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.secao}>
                <Text style={styles.label}>Orçamento por Categoria (Opcional)</Text>
                {TIPOS_GASTO.map((tipo) => (
                  <View key={tipo.nome} style={styles.categoriaInput}>
                    <Text style={styles.categoriaLabel}>
                      {tipo.emoji} {tipo.nome}
                    </Text>
                    <TextInput
                      style={styles.inputPequeno}
                      value={valoresPorCategoria[tipo.nome] || ''}
                      onChangeText={(text) => atualizarValorCategoria(tipo.nome, text)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.botaoCancelar} onPress={onClose}>
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvar} onPress={salvar}>
                <Text style={styles.textoBotaoSalvar}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
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
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 20,
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
  categoriaInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8
  },
  categoriaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1
  },
  inputPequeno: {
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white',
    width: 100,
    textAlign: 'right'
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  botaoCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  textoBotaoCancelar: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16
  },
  botaoSalvar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center'
  },
  textoBotaoSalvar: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});

