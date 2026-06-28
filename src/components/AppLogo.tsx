// Fajr Companion logo — same asset as splash / app icon
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/Colors';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showTitle?: boolean;
}

const SIZES = {
  sm: { box: 56,  ar: 20, en: 11 },
  md: { box: 84,  ar: 28, en: 15 },
  lg: { box: 140, ar: 44, en: 20 },
};

export default function AppLogo({
  size = 'md',
  variant = 'dark',
  showTitle = false,
}: Props) {
  const s = SIZES[size];
  const isDark = variant === 'dark';

  return (
    <View style={styles.wrapper}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: s.box, height: s.box }}
        resizeMode="contain"
      />

      {showTitle && (
        <View style={styles.titleBlock}>
          <Text style={[styles.arabic, {
            fontSize: s.ar,
            color: isDark ? Colors.light : Colors.primary,
          }]}>
            فجر
          </Text>
          <Text style={[styles.english, {
            fontSize: s.en,
            color: isDark ? Colors.white : Colors.textDark,
          }]}>
            FAJR COMPANION
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { alignItems: 'center', gap: 6 },
  titleBlock: { alignItems: 'center', gap: 2 },
  arabic:     { fontWeight: '300', letterSpacing: 2, textAlign: 'center' },
  english:    { fontWeight: '300', letterSpacing: 5, textAlign: 'center' },
});
