/**
 * responsive.js
 * Utilidad de dimensiones adaptativas con clamping mínimo/máximo.
 * Soporta desde ZTE Blade L210 (480×854, API 29) hasta pantallas grandes.
 *
 * Uso:
 *   import { W, H, rs, rv, clamp } from '../theme/responsive';
 *   fontSize: rs(14)     → escala por ancho, mín 12, máx 22
 *   paddingVertical: rv(16)  → escala por alto
 *   borderRadius: clamp(W * 0.03, 8, 16)
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Dimensiones base de diseño (iPhone 12 / Pixel 4)
const BASE_W = 390;
const BASE_H = 844;

export const W = SCREEN_W;
export const H = SCREEN_H;

// Escala horizontal — clamp entre min y max para evitar valores absurdos
export function rs(size, min = size * 0.75, max = size * 1.4) {
  const scaled = size * (SCREEN_W / BASE_W);
  return Math.round(Math.min(Math.max(scaled, min), max));
}

// Escala vertical
export function rv(size, min = size * 0.7, max = size * 1.3) {
  const scaled = size * (SCREEN_H / BASE_H);
  return Math.round(Math.min(Math.max(scaled, min), max));
}

// Clamp genérico
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Tamaños de fuente listos para usar
export const font = {
  xs:   rs(10, 9,  12),
  sm:   rs(12, 11, 14),
  md:   rs(14, 13, 16),
  lg:   rs(16, 14, 18),
  xl:   rs(20, 16, 24),
  xxl:  rs(26, 20, 32),
  title: rs(28, 22, 36),
};

// Espaciado
export const space = {
  xs: rv(4,  3,  8),
  sm: rv(8,  6,  12),
  md: rv(14, 10, 20),
  lg: rv(20, 14, 28),
  xl: rv(28, 18, 36),
  screen: Math.round(SCREEN_W * 0.05),  // padding lateral (5% del ancho)
};

// Bordes redondeados
export const radius = {
  sm:  clamp(Math.round(SCREEN_W * 0.02), 6,  10),
  md:  clamp(Math.round(SCREEN_W * 0.03), 10, 16),
  lg:  clamp(Math.round(SCREEN_W * 0.04), 14, 24),
  xl:  clamp(Math.round(SCREEN_W * 0.05), 18, 32),
  full: 999,
};

// Tamaños de iconos
export const icon = {
  sm: clamp(Math.round(SCREEN_W * 0.045), 16, 22),
  md: clamp(Math.round(SCREEN_W * 0.06),  20, 28),
  lg: clamp(Math.round(SCREEN_W * 0.08),  28, 40),
};

export default { W, H, rs, rv, clamp, font, space, radius, icon };
