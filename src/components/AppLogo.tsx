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
  sm: { box: 44,  ar: 20, en: 11 },
  md: { box: 72,  ar: 28, en: 15 },
  lg: { box: 128, ar: 44, en: 20 },
};

export default function AppLogo({
  size = 'md',
  variant = 'dark',
  showTitle = false,
  elevated = false,
}: Props & { elevated?: boolean }) {
  const s = SIZES[size];
  const isDark = variant === 'dark';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.imageWrap, elevated && styles.imageWrapElevated]}>
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: s.box, height: s.box }}
          resizeMode="contain"
        />
      </View>

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
  wrapper:           { alignItems: 'center', gap: 6 },
  imageWrap:         { overflow: 'hidden', borderRadius: 14 },
  imageWrapElevated: {
    borderWidth: 0.5,
    borderColor: 'rgba(232,168,95,0.35)',
    backgroundColor: 'rgba(232,168,95,0.06)',
    padding: 2,
    borderRadius: 16,
  },
  titleBlock: { alignItems: 'center', gap: 2 },
  arabic:     { fontWeight: '300', letterSpacing: 2, textAlign: 'center' },
  english:    { fontWeight: '300', letterSpacing: 5, textAlign: 'center' },
});
