import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export default function EyeIcon({ visible = true, size = 20, color = '#888' }) {
  if (visible) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      <Path d="M3 3L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}