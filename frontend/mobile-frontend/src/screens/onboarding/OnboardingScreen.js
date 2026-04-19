import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, FlatList, Dimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, Circle, Line, Polyline } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { W, space, radius, rv, clamp, icon } from '../../theme/responsive';

const { width } = Dimensions.get('window');
const ICON_SIZE = icon.lg;

/* ── Iconos ─────────────────────────────────────── */
const Icon1 = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 40 40">
    <Rect x="2"  y="2"  width="16" height="16" rx="4" fill={colors.accent}/>
    <Rect x="22" y="2"  width="16" height="16" rx="4" fill={colors.accent} opacity="0.5"/>
    <Rect x="2"  y="22" width="16" height="16" rx="4" fill={colors.accent} opacity="0.5"/>
    <Rect x="22" y="22" width="16" height="16" rx="4" fill={colors.accent} opacity="0.8"/>
  </Svg>
);

const Icon2 = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 40 40">
    <Circle cx="20" cy="20" r="17" stroke={colors.accent} strokeWidth="2.5"/>
    <Line x1="20" y1="10" x2="20" y2="20" stroke={colors.accent} strokeWidth="2.5"/>
    <Line x1="20" y1="20" x2="28" y2="26" stroke={colors.accent} strokeWidth="2"/>
    <Circle cx="20" cy="20" r="2.5" fill={colors.accent}/>
  </Svg>
);

const Icon3 = () => (
  <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 40 40">
    <Polyline points="4,32 12,20 20,25 28,14 36,18"
      stroke={colors.accent} strokeWidth="2.5" fill="none"/>
    <Line x1="4" y1="36" x2="36" y2="36"
      stroke={colors.accent} strokeWidth="1.5" opacity="0.4"/>
  </Svg>
);

const slides = [
  { id: 1, icon: Icon1, title: 'Organiza tu\ntiempo de estudio', subtitle: 'Conecta tus materias y tareas.', btn: 'Siguiente →' },
  { id: 2, icon: Icon2, title: 'Técnica Pomodoro',               subtitle: 'Sesiones de 25 min.',           btn: 'Siguiente →' },
  { id: 3, icon: Icon3, title: 'Monitorea hábitos',              subtitle: 'Mejora tu productividad.',       btn: 'Comenzar →'  },
];

/* ── Dot animado ─────────────────────────────────── */
function AnimatedDot({ active }) {
  const widthAnim   = useRef(new Animated.Value(active ? 28 : 8)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.25)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: active ? 28 : 8,
        useNativeDriver: false,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.25,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active]);

  return (
    <Animated.View style={[
      styles.dot,
      {
        width: widthAnim,
        opacity: opacityAnim,
        backgroundColor: active ? colors.accent : '#fff',
      },
    ]} />
  );
}

/* ── Screen ──────────────────────────────────────── */
export default function OnboardingScreen({ navigation }) {
  const flatListRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const btnScale = useRef(new Animated.Value(1)).current;

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarding', 'true');
    navigation.replace('Login');
  };

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, tension: 120, friction: 6 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 120, friction: 6 }).start();

  const renderItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.iconBox}>
          <Icon />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Zona inferior — centrada */}
      <View style={styles.bottom}>

        <View style={styles.dots}>
          {slides.map((_, i) => (
            <AnimatedDot key={i} active={i === currentIndex} />
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={styles.btn}
            onPress={goNext}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <Text style={styles.btnText}>{slides[currentIndex].btn}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={finishOnboarding}>
          <Text style={styles.skip}>Omitir introducción</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const BTN_WIDTH = clamp(W * 0.58, 200, 280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  slide: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: space.screen,
    paddingBottom: space.xl,
  },

  iconBox: {
    width:  clamp(W * 0.15, 54, 70),
    height: clamp(W * 0.15, 54, 70),
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },

  title: {
    fontSize: clamp(W * 0.07, 24, 34),
    fontWeight: '800',
    color: '#fff',
    marginBottom: space.sm,
    lineHeight: clamp(W * 0.09, 30, 44),
  },

  subtitle: {
    fontSize: clamp(W * 0.034, 12, 16),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: clamp(W * 0.052, 18, 26),
  },

  bottom: {
    alignItems: 'center',
    paddingHorizontal: space.screen,
    paddingBottom: rv(28, 20, 40),
    paddingTop: rv(18, 12, 26),
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rv(18, 12, 26),
    gap: 6,
  },

  dot: {
    height: 8,
    borderRadius: 4,
  },

  btn: {
    width: BTN_WIDTH,
    backgroundColor: colors.accent,
    paddingVertical: rv(13, 10, 16),
    borderRadius: radius.xl,
    alignItems: 'center',
    marginBottom: rv(12, 8, 18),
  },

  btnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: clamp(W * 0.038, 13, 17),
    letterSpacing: 0.3,
  },

  skip: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: clamp(W * 0.03, 11, 14),
    paddingVertical: space.sm,
  },
});
