import { EstatisticasCategoria } from '@/utils/estatisticas';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface GraficoPizzaProps {
  dados: EstatisticasCategoria[];
  tamanho?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAMANHO_PADRAO = SCREEN_WIDTH < 768 ? 200 : 300;

export default function GraficoPizza({ dados, tamanho = TAMANHO_PADRAO }: GraficoPizzaProps) {
  if (dados.length === 0) {
    return (
      <View style={styles.containerVazio}>
        <Text style={styles.textoVazio}>Sem dados para exibir</Text>
      </View>
    );
  }

  const centro = tamanho / 2;
  const raio = tamanho * 0.35;
  const raioInterno = tamanho * 0.15;

  let anguloAtual = -90; // Começa no topo

  const gerarPath = (porcentagem: number, cor: string, index: number) => {
    const anguloFinal = anguloAtual + (porcentagem / 100) * 360;
    
    const x1 = centro + raio * Math.cos((anguloAtual * Math.PI) / 180);
    const y1 = centro + raio * Math.sin((anguloAtual * Math.PI) / 180);
    const x2 = centro + raio * Math.cos((anguloFinal * Math.PI) / 180);
    const y2 = centro + raio * Math.sin((anguloFinal * Math.PI) / 180);
    
    const x1Interno = centro + raioInterno * Math.cos((anguloAtual * Math.PI) / 180);
    const y1Interno = centro + raioInterno * Math.sin((anguloAtual * Math.PI) / 180);
    const x2Interno = centro + raioInterno * Math.cos((anguloFinal * Math.PI) / 180);
    const y2Interno = centro + raioInterno * Math.sin((anguloFinal * Math.PI) / 180);
    
    const grandeArco = porcentagem > 50 ? 1 : 0;
    
    const path = `M ${centro} ${centro} L ${x1Interno} ${y1Interno} A ${raioInterno} ${raioInterno} 0 ${grandeArco} 1 ${x2Interno} ${y2Interno} Z M ${x1} ${y1} A ${raio} ${raio} 0 ${grandeArco} 1 ${x2} ${y2} L ${x2Interno} ${y2Interno} A ${raioInterno} ${raioInterno} 0 ${grandeArco} 0 ${x1Interno} ${y1Interno} Z`;
    
    anguloAtual = anguloFinal;
    
    return (
      <Path
        key={index}
        d={path}
        fill={cor}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Svg width={tamanho} height={tamanho}>
        <G>
          {dados.map((item, index) => gerarPath(item.porcentagem, item.cor, index))}
        </G>
      </Svg>
      <View style={styles.legenda}>
        {dados.map((item, index) => (
          <View key={index} style={styles.itemLegenda}>
            <View style={[styles.quadradoCor, { backgroundColor: item.cor }]} />
            <View style={styles.textoLegenda}>
              <Text style={styles.nomeCategoria}>
                {item.emoji} {item.categoria}
              </Text>
              <Text style={styles.valorCategoria}>
                {item.total.toFixed(2).replace('.', ',')} MT ({item.porcentagem.toFixed(1)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16
  },
  containerVazio: {
    padding: 40,
    alignItems: 'center'
  },
  textoVazio: {
    color: '#6b7280',
    fontSize: 14
  },
  legenda: {
    marginTop: 20,
    width: '100%',
    gap: 12
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  quadradoCor: {
    width: 20,
    height: 20,
    borderRadius: 4
  },
  textoLegenda: {
    flex: 1
  },
  nomeCategoria: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  valorCategoria: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  }
});

