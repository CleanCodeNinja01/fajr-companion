// Full-screen branded splash — matches native splash.png (dark starfield + logo)
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export default function BrandedSplashScreen() {
  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/splash.png')}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Fajr Companion"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.darkBg },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
