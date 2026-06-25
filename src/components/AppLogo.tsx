// Fajr Companion logo — ringed crescent, drawn with React Native shapes
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  /** Must match the screen/container background so the crescent cutout is invisible */
  bgColor?: string;
}

// All dimensions scale from the box size.
// Crescent = primary-colored full circle + blush cutout shifted right+up.
// Rings = two concentric transparent circles with border only.
// Stars = gold dots in the concave (lower-left) area of the crescent.
const SIZES = {
  sm: { box: 60,  outerRing: 50, innerRing: 43, moon: 31, cutout: 26, dx: 5,  dy: -4, s1: 3.5, s2: 2.2, label: 13 },
  md: { box: 88,  outerRing: 74, innerRing: 63, moon: 46, cutout: 38, dx: 7,  dy: -5, s1: 5.0, s2: 3.0, label: 15 },
  lg: { box: 120, outerRing: 100,innerRing: 85, moon: 62, cutout: 52, dx: 10, dy: -7, s1: 7.0, s2: 4.2, label: 18 },
};

export default function AppLogo({ size = 'md', showLabel = false, bgColor = Colors.background }: Props) {
  const s = SIZES[size];
  const cx = s.box / 2;          // box center x
  const cy = s.box / 2;          // box center y
  const mr = s.moon / 2;         // moon radius

  // Moon circle top-left (centered in box)
  const moonTop  = cy - mr;
  const moonLeft = cx - mr;

  // Cutout circle top-left (shifted from moon center)
  const cutoutR    = s.cutout / 2;
  const cutoutTop  = moonTop  + s.dy;
  const cutoutLeft = moonLeft + s.dx;

  // Star positions — lower-left concave area of crescent
  const starPositions = [
    { top: cy - mr * 0.48, left: cx - mr * 0.52, r: s.s1 },
    { top: cy - mr * 0.08, left: cx - mr * 0.72, r: s.s2 },
    { top: cy + mr * 0.26, left: cx - mr * 0.56, r: s.s2 * 0.65 },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Icon box — transparent to the screen bg so cutout blends in */}
      <View style={[styles.box, { width: s.box, height: s.box, borderRadius: s.box * 0.25, backgroundColor: bgColor }]}>

        {/* Outer ring — accent border */}
        <View style={[styles.ring, {
          width: s.outerRing, height: s.outerRing,
          borderRadius: s.outerRing / 2,
          top:  (s.box - s.outerRing) / 2,
          left: (s.box - s.outerRing) / 2,
          borderColor: Colors.accent,
          borderWidth: 1,
        }]} />

        {/* Inner ring — primary border, thinner */}
        <View style={[styles.ring, {
          width: s.innerRing, height: s.innerRing,
          borderRadius: s.innerRing / 2,
          top:  (s.box - s.innerRing) / 2,
          left: (s.box - s.innerRing) / 2,
          borderColor: Colors.primary,
          borderWidth: 0.75,
        }]} />

        {/* Full moon — primary fill */}
        <View style={[styles.moon, {
          width: s.moon, height: s.moon,
          borderRadius: mr,
          top: moonTop, left: moonLeft,
        }]} />

        {/* Cutout — same as bgColor, carves the crescent */}
        <View style={[styles.cutout, {
          width: s.cutout, height: s.cutout,
          borderRadius: cutoutR,
          top: cutoutTop, left: cutoutLeft,
          backgroundColor: bgColor,
        }]} />

        {/* Gold star dots */}
        {starPositions.map((pos, i) => (
          <View key={i} style={[styles.dot, {
            width: pos.r * 2, height: pos.r * 2,
            borderRadius: pos.r,
            top: pos.top - pos.r,
            left: pos.left - pos.r,
          }]} />
        ))}
      </View>

      {showLabel && (
        <Text style={[styles.label, { fontSize: s.label }]}>Fajr Companion</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 10 },
  box:     { overflow: 'hidden' },
  ring:    { position: 'absolute', backgroundColor: 'transparent' },
  moon:    { position: 'absolute', backgroundColor: Colors.primary },
  cutout:  { position: 'absolute' },
  dot:     { position: 'absolute', backgroundColor: Colors.gold },
  label:   { fontWeight: '500', color: Colors.textDark, letterSpacing: 0.2 },
});
