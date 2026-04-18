import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const { width: W, height: H } = Dimensions.get('window');

// Icono reloj dentro del cuadro amarillo
const ClockIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={colors.primary} strokeWidth="2"/>
    <Line x1="12" y1="7" x2="12" y2="12" stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/>
    <Line x1="12" y1="12" x2="16" y2="14.5" stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="12" cy="12" r="1.5" fill={colors.primary}/>
  </Svg>
);

// Dots de carga animados
function LoadingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800),
        ])
      ).start();

    animate(dots[0], 0);
    animate(dots[1], 250);
    animate(dots[2], 500);
  }, []);

  return (
    <View style={s.dotsRow}>
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={[
            s.dot,
            i === 0 && s.dotActive,
            { opacity },
          ]}
        />
      ))}
    </View>
  );
}

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { loading, authenticated } = useAuth();
  const routed = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 700, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (loading || routed.current) return;
    routed.current = true;

    const navigate = async () => {
      await new Promise(res => setTimeout(res, 2200));
      if (authenticated) {
        navigation.replace('Main');
      } else {
        const seen = await AsyncStorage.getItem('onboarding');
        navigation.replace(seen ? 'Login' : 'Onboarding');
      }
    };

    navigate();
  }, [loading]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Círculos decorativos */}
      <View style={s.circleTopRight} />
      <View style={s.circleBottomLeft} />

      {/* Contenido central */}
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {/* Ícono */}
        <View style={s.iconBox}>
          <ClockIcon />
        </View>

        {/* Título */}
        <Text style={s.title}>
          <Text style={s.titleWhite}>Time</Text>
          <Text style={s.titleYellow}>Focus</Text>
        </Text>

        {/* Subtítulo */}
        <Text style={s.subtitle}>PRODUCTIVIDAD ACADÉMICA</Text>

        {/* Dots de carga */}
        <LoadingDots />
      </Animated.View>

      {/* Versión */}
      <Text style={s.version}>V 1.0.0</Text>
    </View>
  );
}

const CIRCLE = W * 0.55;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTopRight: {
    position: 'absolute',
    top: -CIRCLE * 0.3,
    right: -CIRCLE * 0.3,
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -CIRCLE * 0.35,
    left: -CIRCLE * 0.35,
    width: CIRCLE * 0.85,
    height: CIRCLE * 0.85,
    borderRadius: (CIRCLE * 0.85) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  titleWhite: {
    color: '#fff',
  },
  titleYellow: {
    color: colors.accent,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3,
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  version: {
    position: 'absolute',
    bottom: 28,
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
  },
});
