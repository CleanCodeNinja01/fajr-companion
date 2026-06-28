// Shared splash / onboarding hero — logo, title, tagline
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import AppLogo from './AppLogo';

interface Props {
  tagline?: string;
}

export default function SplashHero({
  tagline = 'Wake up. Pray. Begin your day with purpose.',
}: Props) {
  return (
    <View style={styles.hero}>
      <AppLogo size="lg" variant="dark" />
      <View style={styles.divider} />
      <Text style={styles.arabic}>فجر</Text>
      <Text style={styles.appName}>FAJR COMPANION</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero:    { alignItems: 'center', gap: 14 },
  divider: { width: 28, height: 1, backgroundColor: Colors.gold },
  arabic:  {
    fontSize: 54,
    fontWeight: '200',
    color: Colors.light,
    letterSpacing: Platform.OS === 'android' ? 6 : 10,
    includeFontPadding: false,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  appName: { fontSize: 12, fontWeight: '300', color: Colors.headerText, letterSpacing: 4 },
  tagline: { fontSize: 12, color: Colors.textMuted, textAlign: 'center',
             lineHeight: 20, marginTop: 2, paddingHorizontal: 24 },
});
