import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

interface DadoLinha {
  data: string;
  total: number;
}

interface GraficoLinhaProps {
  dados: DadoLinha[];
  cor?: string;
  altura?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALTURA_PADRAO = SCREEN_WIDTH < 768 ? 200 : 250;
const PADDING = 40;
const PADDING_VERTICAL = 20;

export default function GraficoLinha({ 
  dados, 
  cor = '#10b981',
  altura = ALTURA_PADRAO 
}: GraficoLinhaProps) {
  if (dados.length === 0) {
    return (
      <View style={styles.containerVazio}>
        <Text style={styles.textoVazio}>Sem dados para exibir</Text>
      </View>
    );
  }

  const largura = SCREEN_WIDTH - 64;
  const areaGrafico = {
    x: PADDING,
    y: PADDING_VERTICAL,
    width: largura - PADDING * 2,
    height: altura - PADDING_VERTICAL * 2
  };

  const valores = dados.map(d => d.total);
  const maxValor = Math.max(...valores, 1);
  const minValor = Math.min(...valores, 0);
  const range = maxValor - minValor || 1;

  const pontos = dados.map((item, index) => {
    const x = areaGrafico.x + (index / (dados.length - 1 || 1)) * areaGrafico.width;
    const y = areaGrafico.y + areaGrafico.height - ((item.total - minValor) / range) * areaGrafico.height;
    return { x, y };
  });

  const formatarData = (dataISO: string): string => {
    const [, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={largura} height={altura}>
        {/* Linha de fundo */}
        <Line
          x1={areaGrafico.x}
          y1={areaGrafico.y + areaGrafico.height}
          x2={areaGrafico.x + areaGrafico.width}
          y2={areaGrafico.y + areaGrafico.height}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Linha do gráfico */}
        <Polyline
          points={pontos.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={cor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Pontos */}
        {pontos.map((ponto, index) => (
          <Circle
            key={index}
            cx={ponto.x}
            cy={ponto.y}
            r="4"
            fill={cor}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </Svg>
      <View style={styles.eixos}>
        {dados.map((item, index) => (
          <Text key={index} style={styles.labelEixo}>
            {formatarData(item.data)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  eixos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8
  },
  labelEixo: {
    fontSize: 10,
    color: '#6b7280'
  }
});

