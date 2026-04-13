import FiltrosGastos from '@/components/FiltrosGastos';
import ModalOrcamento from '@/components/ModalOrcamento';
import ModalReceita from '@/components/ModalReceita';
import OrcamentoCard from '@/components/OrcamentoCard';
import { Filtros, Gasto, Orcamento, Receita, TIPOS_GASTO, TIPOS_RECEITA } from '@/types';
import { filtrarGastos } from '@/utils/filtros';
import { processarGastosRecorrentes } from '@/utils/gastosRecorrentes';
import { carregarOrcamento, obterMesAtual, salvarOrcamento } from '@/utils/orcamento';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Detectar tamanho da tela
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;
const isSmallScreen = SCREEN_WIDTH < 375;

export default function ControleGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<Gasto[]>([]);
  const [telaAtual, setTelaAtual] = useState<'lista' | 'adicionar'>('lista');
  const [gastoAtual, setGastoAtual] = useState<Gasto | null>(null);
  const [tipo, setTipo] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [recorrente, setRecorrente] = useState<{ ativo: boolean; frequencia: 'diario' | 'semanal' | 'mensal' }>({ ativo: false, frequencia: 'mensal' });
  const [filtros, setFiltros] = useState<Filtros>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarReceita, setMostrarReceita] = useState(false);
  const [receitaAtual, setReceitaAtual] = useState<Receita | null>(null);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [mostrarOrcamento, setMostrarOrcamento] = useState(false);
  const [mostrarListaReceitas, setMostrarListaReceitas] = useState(false);

  useEffect(() => {
    carregarDados();
    processarGastosRecorrentes().then(novosGastos => {
      if (novosGastos.length > 0) {
        carregarDados();
      }
    });
  }, []);

  useEffect(() => {
    const filtrados = filtrarGastos(gastos, filtros);
    setGastosFiltrados(filtrados);
  }, [gastos, filtros]);

  const carregarDados = async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const gastoKeys = keys.filter(key => key.startsWith('gasto:'));
      const receitaKeys = keys.filter(key => key.startsWith('receita:'));
      
      if (gastoKeys.length > 0) {
        const gastosArray = await AsyncStorage.multiGet(gastoKeys);
        const gastosCarregados: Gasto[] = gastosArray
          .map(([key, value]) => (value ? JSON.parse(value) : null))
          .filter((g): g is Gasto => g !== null);
        
        gastosCarregados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        setGastos(gastosCarregados);
      }

      if (receitaKeys.length > 0) {
        const receitasArray = await AsyncStorage.multiGet(receitaKeys);
        const receitasCarregadas: Receita[] = receitasArray
          .map(([key, value]) => (value ? JSON.parse(value) : null))
          .filter((r): r is Receita => r !== null);
        setReceitas(receitasCarregadas);
      }

      // Carregar orçamento do mês atual
      const mesAtual = obterMesAtual();
      const orcamentoAtual = await carregarOrcamento(mesAtual);
      setOrcamento(orcamentoAtual);
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
      setGastos([]);
      setReceitas([]);
    }
  };

  const salvarGasto = async (): Promise<void> => {
    if (!tipo || !valor || !data || !descricao.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos!');
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Atenção', 'Por favor, insira um valor válido!');
      return;
    }

    const gasto: Gasto = {
      id: gastoAtual?.id || Date.now().toString(),
      tipo,
      valor: valorNumerico,
      data,
      descricao: descricao.trim(),
      dataCriacao: gastoAtual?.dataCriacao || new Date().toISOString(),
      recorrente: recorrente.ativo ? {
        ativo: true,
        frequencia: recorrente.frequencia,
        proximaData: recorrente.ativo ? (() => {
          const dataBase = new Date(data);
          switch (recorrente.frequencia) {
            case 'diario':
              dataBase.setDate(dataBase.getDate() + 1);
              break;
            case 'semanal':
              dataBase.setDate(dataBase.getDate() + 7);
              break;
            case 'mensal':
              dataBase.setMonth(dataBase.getMonth() + 1);
              break;
          }
          return dataBase.toISOString().split('T')[0];
        })() : undefined
      } : undefined
    };

    try {
      await AsyncStorage.setItem(`gasto:${gasto.id}`, JSON.stringify(gasto));
      await carregarDados();
      limparFormulario();
      setTelaAtual('lista');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o gasto.');
    }
  };

  const salvarReceita = async (receita: Receita): Promise<void> => {
    try {
      await AsyncStorage.setItem(`receita:${receita.id}`, JSON.stringify(receita));
      await carregarDados();
      setMostrarReceita(false);
      setReceitaAtual(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a receita.');
    }
  };

  const salvarOrcamentoHandler = async (novoOrcamento: Orcamento): Promise<void> => {
    try {
      await salvarOrcamento(novoOrcamento);
      await carregarDados();
      setMostrarOrcamento(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o orçamento.');
    }
  };

  const deletarGasto = async (id: string): Promise<void> => {
    const executarDelecao = async () => {
      try {
        const key = `gasto:${id}`;
        
        // Remove do AsyncStorage
        await AsyncStorage.removeItem(key);
        
        // Atualiza o estado removendo o gasto imediatamente
        setGastos((prevGastos) => {
          const novosGastos = prevGastos.filter((g) => g.id !== id);
          return novosGastos;
        });
        
        console.log('Gasto deletado com sucesso:', id);
      } catch (error) {
        console.error('Erro ao deletar:', error);
        if (Platform.OS === 'web') {
          window.alert('Erro: Não foi possível deletar o gasto.');
        } else {
          Alert.alert('Erro', 'Não foi possível deletar o gasto.');
        }
        // Recarrega os dados em caso de erro para manter consistência
        await carregarDados();
      }
    };

    // Usa window.confirm na web e Alert.alert em mobile
    if (Platform.OS === 'web') {
      const confirmado = window.confirm('Tem certeza que deseja deletar este gasto?');
      if (confirmado) {
        await executarDelecao();
      }
    } else {
      Alert.alert(
        'Confirmar',
        'Tem certeza que deseja deletar este gasto?',
        [
          { 
            text: 'Cancelar', 
            style: 'cancel'
          },
          {
            text: 'Deletar',
            style: 'destructive',
            onPress: executarDelecao,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const editarGasto = (gasto: Gasto): void => {
    setGastoAtual(gasto);
    setTipo(gasto.tipo);
    setValor(gasto.valor.toString());
    setData(gasto.data);
    setDescricao(gasto.descricao);
    setRecorrente(gasto.recorrente?.ativo ? {
      ativo: true,
      frequencia: gasto.recorrente.frequencia
    } : { ativo: false, frequencia: 'mensal' });
    setTelaAtual('adicionar');
  };

  const editarReceita = (receita: Receita): void => {
    setReceitaAtual(receita);
    setMostrarReceita(true);
  };

  const deletarReceita = async (id: string): Promise<void> => {
    const executarDelecao = async () => {
      try {
        await AsyncStorage.removeItem(`receita:${id}`);
        await carregarDados();
      } catch (error) {
        console.error('Erro ao deletar receita:', error);
        if (Platform.OS === 'web') {
          window.alert('Erro: Não foi possível deletar a receita.');
        } else {
          Alert.alert('Erro', 'Não foi possível deletar a receita.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmado = window.confirm('Tem certeza que deseja deletar esta receita?');
      if (confirmado) {
        await executarDelecao();
      }
    } else {
      Alert.alert(
        'Confirmar',
        'Tem certeza que deseja deletar esta receita?',
        [
          { 
            text: 'Cancelar', 
            style: 'cancel'
          },
          {
            text: 'Deletar',
            style: 'destructive',
            onPress: executarDelecao,
          },
        ],
        { cancelable: true }
      );
    }
  };


  const novoGasto = (): void => {
    limparFormulario();
    setData(new Date().toISOString().split('T')[0]);
    setTelaAtual('adicionar');
  };

  const limparFormulario = (): void => {
    setGastoAtual(null);
    setTipo('');
    setValor('');
    setData('');
    setDescricao('');
    setRecorrente({ ativo: false, frequencia: 'mensal' });
  };

  const formatarData = (dataISO: string): string => {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number): string => {
    return `${valor.toFixed(2).replace('.', ',')} MT`;
  };

  const calcularTotal = (): number => {
    return gastosFiltrados.reduce((total, gasto) => total + gasto.valor, 0);
  };

  const calcularTotalReceitas = (): number => {
    return receitas.reduce((total, receita) => total + receita.valor, 0);
  };

  const calcularSaldo = (): number => {
    return calcularTotalReceitas() - calcularTotal();
  };

  const getIconeTipo = (tipoNome: string) => {
    const tipo = TIPOS_GASTO.find(t => t.nome === tipoNome);
    return tipo || TIPOS_GASTO[TIPOS_GASTO.length - 1];
  };


  // TELA DE ADICIONAR/EDITAR
  if (telaAtual === 'adicionar') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#d1fae5" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
          <View style={styles.containerInterno}>
            <View style={styles.cardBranco}>
              {/* Header */}
              <View style={[styles.headerAdicionar, isMobile && styles.headerAdicionarMobile]}>
                <View style={styles.headerTituloContainer}>
                  <Text style={[styles.emojiGrande, isMobile && styles.emojiGrandeMobile]}>💰</Text>
                  <Text style={[styles.headerTitulo, isMobile && styles.headerTituloMobile]}>
                    {gastoAtual ? 'Editar Gasto' : 'Novo Gasto'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    limparFormulario();
                    setTelaAtual('lista');
                  }}
                  style={styles.botaoFechar}
                >
                  <Text style={[styles.textoFechar, isMobile && styles.textoFecharMobile]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Formulário */}
              <View style={styles.espacamento}>
                {/* Tipo de Gasto */}
                <Text style={styles.label}>Tipo de Gasto</Text>
                <View style={styles.gridTipos}>
                  {TIPOS_GASTO.map((tipoItem) => (
                    <TouchableOpacity
                      key={tipoItem.nome}
                      onPress={() => setTipo(tipoItem.nome)}
                      style={[
                        styles.botaoTipo,
                        tipo === tipoItem.nome && {
                          borderColor: tipoItem.cor,
                          backgroundColor: tipoItem.cor + '20',
                        }
                      ]}
                    >
                      <Text style={styles.emojiTipo}>{tipoItem.emoji}</Text>
                      <Text style={styles.textoTipo}>{tipoItem.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Valor */}
                <Text style={styles.label}>Quanto gastou? (MZN)</Text>
                <TextInput
                  style={styles.input}
                  value={valor}
                  onChangeText={setValor}
                  placeholder="Ex: 500"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9ca3af"
                />

                {/* Data */}
                <Text style={styles.label}>Data do Gasto (AAAA-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={data}
                  onChangeText={setData}
                  placeholder="Ex: 2024-01-15"
                  placeholderTextColor="#9ca3af"
                />

                {/* Gasto Recorrente */}
                <View style={styles.secaoRecorrente}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRecorrente({ ...recorrente, ativo: !recorrente.ativo })}
                  >
                    <Text style={styles.checkbox}>{recorrente.ativo ? '✓' : ''}</Text>
                    <Text style={styles.label}>Marcar como gasto recorrente</Text>
                  </TouchableOpacity>
                  {recorrente.ativo && (
                    <View style={styles.frequenciaContainer}>
                      <Text style={styles.label}>Frequência</Text>
                      <View style={styles.gridFrequencia}>
                        {(['diario', 'semanal', 'mensal'] as const).map((freq) => (
                          <TouchableOpacity
                            key={freq}
                            style={[
                              styles.botaoFrequencia,
                              recorrente.frequencia === freq && styles.botaoFrequenciaSelecionado
                            ]}
                            onPress={() => setRecorrente({ ...recorrente, frequencia: freq })}
                          >
                            <Text
                              style={[
                                styles.textoFrequencia,
                                recorrente.frequencia === freq && styles.textoFrequenciaSelecionado
                              ]}
                            >
                              {freq === 'diario' ? 'Diário' :
                               freq === 'semanal' ? 'Semanal' : 'Mensal'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Descrição */}
                <Text style={styles.label}>Gastou com o quê?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Ex: Almoço no restaurante..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#9ca3af"
                />

                {/* Botão Salvar */}
                <TouchableOpacity style={styles.botaoSalvar} onPress={salvarGasto}>
                  <Text style={styles.textoBotaoSalvar}>💾 Salvar Gasto</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // TELA LISTA
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#d1fae5" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.containerInterno}>
            {/* Header Principal */}
          <View style={styles.cardBranco}>
            <View style={[styles.headerPrincipal, isMobile && styles.headerPrincipalMobile]}>
              <View style={styles.headerTituloContainer}>
                <Text style={[styles.emojiGrande, isMobile && styles.emojiGrandeMobile]}>💰</Text>
                <Text style={[styles.tituloPrincipal, isMobile && styles.tituloPrincipalMobile]}>
                  {isMobile ? 'Gastos' : 'Controle de Gastos'}
                </Text>
              </View>
              <View style={styles.botoesHeader}>
                <TouchableOpacity
                  style={[styles.botaoFiltro, isMobile && styles.botaoFiltroMobile]}
                  onPress={() => setMostrarFiltros(true)}
                >
                  <Text style={styles.textoBotaoFiltro}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.botaoNovo, isMobile && styles.botaoNovoMobile]} onPress={novoGasto}>
                  <Text style={[styles.textoBotaoNovo, isMobile && styles.textoBotaoNovoMobile]}>
                    {isMobile ? '+ Novo' : '+ Novo Gasto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cards de Resumo */}
            <View style={styles.gridResumo}>
              <View style={[styles.cardResumo, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.resumoLabel}>Gastos</Text>
                <Text style={styles.resumoValor}>{formatarMoeda(calcularTotal())}</Text>
                <Text style={styles.resumoContador}>
                  {gastosFiltrados.length} {gastosFiltrados.length === 1 ? 'gasto' : 'gastos'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cardResumo, { backgroundColor: '#10b981' }]}
                onPress={() => setMostrarListaReceitas(!mostrarListaReceitas)}
                activeOpacity={0.8}
              >
                <View style={styles.cardResumoHeader}>
                  <View style={styles.cardResumoContent}>
                    <Text style={styles.resumoLabel}>Receitas</Text>
                    <Text style={styles.resumoValor}>{formatarMoeda(calcularTotalReceitas())}</Text>
                    <Text style={styles.resumoContador}>
                      {receitas.length} {receitas.length === 1 ? 'receita' : 'receitas'}
                    </Text>
                  </View>
                  <Text style={styles.iconeExpandir}>
                    {mostrarListaReceitas ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Lista de Receitas */}
            {mostrarListaReceitas && receitas.length > 0 && (
              <View style={styles.cardBranco}>
                <Text style={styles.listaTitulo}>📋 Lista de Receitas</Text>
                <View style={styles.listaReceitas}>
                  {receitas.map((receita) => {
                    const tipoInfo = TIPOS_RECEITA.find(t => t.nome === receita.tipo) || TIPOS_RECEITA[TIPOS_RECEITA.length - 1];
                    return (
                      <View
                        key={receita.id}
                        style={[styles.cardReceita, { borderLeftColor: tipoInfo.cor }]}
                      >
                        <View style={styles.receitaConteudo}>
                          <View style={styles.receitaEsquerda}>
                            <View style={[styles.iconeContainer, { backgroundColor: tipoInfo.cor + '30' }]}>
                              <Text style={styles.iconeEmoji}>{tipoInfo.emoji}</Text>
                            </View>
                            <View style={styles.receitaInfo}>
                              <View style={styles.receitaTags}>
                                <View style={[styles.tagTipo, { backgroundColor: tipoInfo.cor + '30' }]}>
                                  <Text style={[styles.tagTexto, { color: tipoInfo.cor }]}>
                                    {receita.tipo}
                                  </Text>
                                </View>
                                <Text style={styles.receitaData}>{formatarData(receita.data)}</Text>
                              </View>
                              <Text style={styles.receitaDescricao}>{receita.descricao}</Text>
                              <Text style={styles.receitaValor}>{formatarMoeda(receita.valor)}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.receitaBotoes}>
                          <TouchableOpacity
                            style={styles.botaoEditar}
                            onPress={() => editarReceita(receita)}
                          >
                            <Text style={styles.textoBotaoAcao}>✏️ Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.botaoDeletar}
                            onPress={() => deletarReceita(receita.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.textoBotaoAcao}>🗑️ Deletar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {mostrarListaReceitas && receitas.length === 0 && (
              <View style={styles.cardBranco}>
                <View style={styles.vazioContainer}>
                  <Text style={styles.emojiVazio}>💵</Text>
                  <Text style={styles.vazioTitulo}>Nenhuma receita registrada</Text>
                  <Text style={styles.vazioTexto}>
                    Adicione sua primeira receita!
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.cardSaldo}>
              <Text style={styles.saldoLabel}>Saldo</Text>
              <Text style={[styles.saldoValor, { color: calcularSaldo() >= 0 ? '#10b981' : '#ef4444' }]}>
                {formatarMoeda(calcularSaldo())}
              </Text>
            </View>
          </View>

          {/* Orçamento */}
          {orcamento && (
            <OrcamentoCard
              orcamento={orcamento}
              gastos={gastosFiltrados}
              onEditar={() => {
                setTimeout(() => {
                  setMostrarOrcamento(true);
                }, 100);
              }}
            />
          )}
          {!orcamento && (
            <View style={styles.cardBranco}>
              <TouchableOpacity
                style={styles.botaoOrcamento}
                onPress={() => {
                  setTimeout(() => {
                    setMostrarOrcamento(true);
                  }, 100);
                }}
              >
                <Text style={styles.textoBotaoOrcamento}>💰 Criar Orçamento Mensal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botões de Ação Rápida */}
          <View style={styles.cardBranco}>
            <View style={styles.botoesRapidos}>
              <TouchableOpacity
                style={styles.botaoRapido}
                onPress={() => {
                  setReceitaAtual(null);
                  setTimeout(() => {
                    setMostrarReceita(true);
                  }, 100);
                }}
              >
                <Text style={styles.emojiBotaoRapido}>💵</Text>
                <Text style={styles.textoBotaoRapido}>Nova Receita</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoRapido}
                onPress={() => {
                  setTimeout(() => {
                    setMostrarOrcamento(true);
                  }, 100);
                }}
              >
                <Text style={styles.emojiBotaoRapido}>📊</Text>
                <Text style={styles.textoBotaoRapido}>Orçamento</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Gastos ou Vazio */}
          {gastosFiltrados.length === 0 ? (
            <View style={styles.cardBranco}>
              <View style={styles.vazioContainer}>
                <Text style={styles.emojiVazio}>💰</Text>
                <Text style={styles.vazioTitulo}>Nenhum gasto registrado</Text>
                <Text style={styles.vazioTexto}>
                  Comece a controlar seus gastos agora!
                </Text>
                <TouchableOpacity style={styles.botaoVazio} onPress={novoGasto}>
                  <Text style={styles.textoBotaoVazio}>Registrar Primeiro Gasto</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.listaGastos}>
              {gastosFiltrados.map((gasto) => {
                const tipoInfo = getIconeTipo(gasto.tipo);
                return (
                  <View
                    key={gasto.id}
                    style={[styles.cardGasto, { borderLeftColor: tipoInfo.cor }]}
                  >
                    <View style={styles.gastoConteudo}>
                      <View style={styles.gastoEsquerda}>
                        <View style={[styles.iconeContainer, { backgroundColor: tipoInfo.cor + '30' }]}>
                          <Text style={styles.iconeEmoji}>{tipoInfo.emoji}</Text>
                        </View>
                        <View style={styles.gastoInfo}>
                          <View style={styles.gastoTags}>
                            <View style={[styles.tagTipo, { backgroundColor: tipoInfo.cor + '30' }]}>
                              <Text style={[styles.tagTexto, { color: tipoInfo.cor }]}>
                                {gasto.tipo}
                              </Text>
                            </View>
                            <Text style={styles.gastoData}>{formatarData(gasto.data)}</Text>
                            {gasto.recorrente?.ativo && (
                              <View style={styles.badgeRecorrente}>
                                <Text style={styles.textoBadgeRecorrente}>
                                  🔄 {gasto.recorrente.frequencia === 'diario' ? 'Diário' :
                                      gasto.recorrente.frequencia === 'semanal' ? 'Semanal' : 'Mensal'}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.gastoDescricao}>{gasto.descricao}</Text>
                          <Text style={styles.gastoValor}>{formatarMoeda(gasto.valor)}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.gastoBotoes}>
                      <TouchableOpacity
                        style={styles.botaoEditar}
                        onPress={() => {
                          console.log('Editando gasto:', gasto.id);
                          editarGasto(gasto);
                        }}
                      >
                        <Text style={styles.textoBotaoAcao}>✏️ Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.botaoDeletar}
                        onPress={() => {
                          console.log('Clicou deletar, ID:', gasto.id);
                          deletarGasto(gasto.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.textoBotaoAcao}>🗑️ Deletar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modais */}
      <FiltrosGastos
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onClose={() => setMostrarFiltros(false)}
        visible={mostrarFiltros}
      />

      <ModalReceita
        visible={mostrarReceita}
        receita={receitaAtual}
        onSalvar={salvarReceita}
        onClose={() => {
          setMostrarReceita(false);
          // Resetar após um pequeno delay para garantir que o modal fechou
          setTimeout(() => {
            setReceitaAtual(null);
          }, 300);
        }}
      />

      <ModalOrcamento
        visible={mostrarOrcamento}
        orcamento={orcamento}
        onSalvar={salvarOrcamentoHandler}
        onClose={() => {
          setMostrarOrcamento(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1fae5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  containerInterno: {
    padding: isMobile ? 12 : 16,
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
    elevation: 5,
  },
  
  // Header Adicionar
  headerAdicionar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerAdicionarMobile: {
    marginBottom: 16,
  },
  headerTituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  emojiGrande: {
    fontSize: 28,
  },
  emojiGrandeMobile: {
    fontSize: 24,
  },
  headerTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    flexShrink: 1,
  },
  headerTituloMobile: {
    fontSize: 20,
  },
  botaoFechar: {
    padding: 8,
    marginLeft: 8,
  },
  textoFechar: {
    fontSize: 24,
    color: '#6b7280',
  },
  textoFecharMobile: {
    fontSize: 20,
  },
  
  // Formulário
  espacamento: {
    gap: 16,
  },
  label: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  gridTipos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isMobile ? 8 : 12,
  },
  botaoTipo: {
    width: isMobile ? (isSmallScreen ? '48%' : '47%') : '47%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 12 : 16,
    alignItems: 'center',
  },
  emojiTipo: {
    fontSize: isMobile ? 28 : 32,
    marginBottom: isMobile ? 6 : 8,
  },
  textoTipo: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1fae5',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 10 : 12,
    fontSize: isMobile ? 15 : 16,
    color: '#000',
  },
  textArea: {
    height: isMobile ? 80 : 100,
    textAlignVertical: 'top',
  },
  botaoSalvar: {
    backgroundColor: '#10b981',
    padding: isMobile ? 14 : 16,
    borderRadius: isMobile ? 10 : 12,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotaoSalvar: {
    color: 'white',
    fontSize: isMobile ? 16 : 18,
    fontWeight: 'bold',
  },
  
  // Header Principal
  headerPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  headerPrincipalMobile: {
    marginBottom: 12,
    gap: 8,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#065f46',
    flex: 1,
    flexShrink: 1,
  },
  tituloPrincipalMobile: {
    fontSize: 22,
  },
  botaoNovo: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  botaoNovoMobile: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoBotaoNovo: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoBotaoNovoMobile: {
    fontSize: 14,
  },
  
  // Card Total
  cardTotal: {
    backgroundColor: '#10b981',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 16 : 24,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  emojiTrending: {
    fontSize: isMobile ? 18 : 20,
  },
  totalLabel: {
    color: 'white',
    fontSize: isMobile ? 11 : 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  totalValor: {
    color: 'white',
    fontSize: isMobile ? 28 : 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalContador: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isMobile ? 12 : 14,
  },
  
  // Estado Vazio
  vazioContainer: {
    alignItems: 'center',
    paddingVertical: isMobile ? 16 : 20,
  },
  emojiVazio: {
    fontSize: isMobile ? 48 : 64,
    marginBottom: isMobile ? 12 : 16,
  },
  vazioTitulo: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  vazioTexto: {
    fontSize: isMobile ? 14 : 16,
    color: '#6b7280',
    marginBottom: isMobile ? 20 : 24,
    textAlign: 'center',
    paddingHorizontal: isMobile ? 8 : 0,
  },
  botaoVazio: {
    backgroundColor: '#10b981',
    paddingHorizontal: isMobile ? 24 : 32,
    paddingVertical: isMobile ? 10 : 12,
    borderRadius: isMobile ? 10 : 12,
  },
  textoBotaoVazio: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: isMobile ? 14 : 16,
  },
  
  // Lista de Gastos
  listaGastos: {
    gap: isMobile ? 12 : 16,
  },
  cardGasto: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 16 : 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gastoConteudo: {
    marginBottom: isMobile ? 10 : 12,
  },
  gastoEsquerda: {
    flexDirection: 'row',
    gap: isMobile ? 12 : 16,
  },
  iconeContainer: {
    width: isMobile ? 40 : 48,
    height: isMobile ? 40 : 48,
    borderRadius: isMobile ? 10 : 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconeEmoji: {
    fontSize: isMobile ? 20 : 24,
  },
  gastoInfo: {
    flex: 1,
    minWidth: 0,
  },
  gastoTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  tagTipo: {
    paddingHorizontal: isMobile ? 10 : 12,
    paddingVertical: 4,
    borderRadius: isMobile ? 10 : 12,
  },
  tagTexto: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: 'bold',
  },
  gastoData: {
    fontSize: isMobile ? 11 : 12,
    color: '#6b7280',
  },
  gastoDescricao: {
    fontSize: isMobile ? 13 : 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  gastoValor: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  gastoBotoes: {
    flexDirection: 'row',
    gap: isMobile ? 6 : 8,
  },
  botaoEditar: {
    backgroundColor: '#dbeafe',
    flex: 1,
    paddingVertical: isMobile ? 8 : 10,
    borderRadius: isMobile ? 6 : 8,
    alignItems: 'center',
  },
  botaoDeletar: {
    backgroundColor: '#fee2e2',
    flex: 1,
    paddingVertical: isMobile ? 8 : 10,
    borderRadius: isMobile ? 6 : 8,
    alignItems: 'center',
  },
  textoBotaoAcao: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
  },
  secaoRecorrente: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 16,
    color: '#10b981',
    lineHeight: 20,
  },
  frequenciaContainer: {
    marginTop: 12,
  },
  gridFrequencia: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoFrequencia: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  botaoFrequenciaSelecionado: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  textoFrequencia: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textoFrequenciaSelecionado: {
    color: 'white',
  },
  botoesHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  botaoFiltro: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  botaoFiltroMobile: {
    padding: 8,
  },
  textoBotaoFiltro: {
    fontSize: 20,
  },
  gridResumo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cardResumo: {
    flex: 1,
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 12 : 16,
  },
  resumoLabel: {
    color: 'white',
    fontSize: isMobile ? 11 : 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resumoValor: {
    color: 'white',
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resumoContador: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isMobile ? 11 : 12,
  },
  cardSaldo: {
    backgroundColor: 'white',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 12 : 16,
    alignItems: 'center',
  },
  saldoLabel: {
    fontSize: isMobile ? 12 : 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  saldoValor: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: 'bold',
  },
  botaoOrcamento: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotaoOrcamento: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  botoesRapidos: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoRapido: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emojiBotaoRapido: {
    fontSize: 24,
    marginBottom: 8,
  },
  textoBotaoRapido: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  badgeRecorrente: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textoBadgeRecorrente: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e40af',
  },
  cardResumoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardResumoContent: {
    flex: 1,
  },
  iconeExpandir: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    marginLeft: 8,
  },
  listaTitulo: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 16,
  },
  listaReceitas: {
    gap: isMobile ? 12 : 16,
  },
  cardReceita: {
    backgroundColor: '#f9fafb',
    borderRadius: isMobile ? 10 : 12,
    padding: isMobile ? 16 : 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  receitaConteudo: {
    marginBottom: isMobile ? 10 : 12,
  },
  receitaEsquerda: {
    flexDirection: 'row',
    gap: isMobile ? 12 : 16,
  },
  receitaInfo: {
    flex: 1,
    minWidth: 0,
  },
  receitaTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isMobile ? 8 : 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  receitaData: {
    fontSize: isMobile ? 11 : 12,
    color: '#6b7280',
  },
  receitaDescricao: {
    fontSize: isMobile ? 13 : 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  receitaValor: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  receitaBotoes: {
    flexDirection: 'row',
    gap: isMobile ? 6 : 8,
  },
});