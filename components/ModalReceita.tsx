import { Receita, TIPOS_RECEITA } from '@/types';
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

interface ModalReceitaProps {
  visible: boolean;
  receita?: Receita | null;
  onSalvar: (receita: Receita) => void;
  onClose: () => void;
}

export default function ModalReceita({
  visible,
  receita,
  onSalvar,
  onClose
}: ModalReceitaProps) {
  const [tipo, setTipo] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (receita) {
        setTipo(receita.tipo);
        setValor(receita.valor.toString());
        setData(receita.data);
        setDescricao(receita.descricao);
      } else {
        setTipo('');
        setValor('');
        setData(new Date().toISOString().split('T')[0]);
        setDescricao('');
      }
    } else {
      // Limpar campos quando o modal fecha
      setTipo('');
      setValor('');
      setData(new Date().toISOString().split('T')[0]);
      setDescricao('');
    }
  }, [receita, visible]);

  const salvar = () => {
    if (!tipo || !valor || !data || !descricao.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos!');
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Atenção', 'Por favor, insira um valor válido!');
      return;
    }

    const novaReceita: Receita = {
      id: receita?.id || Date.now().toString(),
      tipo,
      valor: valorNumerico,
      data,
      descricao: descricao.trim(),
      dataCriacao: receita?.dataCriacao || new Date().toISOString()
    };

    onSalvar(novaReceita);
    onClose();
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
                {receita ? 'Editar Receita' : 'Nova Receita'}
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
                <Text style={styles.label}>Tipo de Receita</Text>
                <View style={styles.gridTipos}>
                  {TIPOS_RECEITA.map((tipoItem) => (
                    <TouchableOpacity
                      key={tipoItem.nome}
                      onPress={() => setTipo(tipoItem.nome)}
                      style={[
                        styles.botaoTipo,
                        tipo === tipoItem.nome && {
                          borderColor: tipoItem.cor,
                          backgroundColor: tipoItem.cor + '20'
                        }
                      ]}
                    >
                      <Text style={styles.emojiTipo}>{tipoItem.emoji}</Text>
                      <Text style={styles.textoTipo}>{tipoItem.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.secao}>
                <Text style={styles.label}>Valor (MZN)</Text>
                <TextInput
                  style={styles.input}
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 5000"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.secao}>
                <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={data}
                  onChangeText={setData}
                  placeholder="Ex: 2024-01-15"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.secao}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Ex: Salário mensal..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9ca3af"
                />
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
  emojiTipo: {
    fontSize: 24,
    marginBottom: 4
  },
  textoTipo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
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
  },
});

