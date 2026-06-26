// Full-screen branded splash — matches onboarding look (dark bg + starfield + hero)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import StarfieldBackground from './StarfieldBackground';
import SplashHero from './SplashHero';

export default function BrandedSplashScreen() {
  return (
    <View style={styles.root}>
      <StarfieldBackground />
      <View style={styles.content}>
        <SplashHero />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.darkBg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 48 },
});
