// Compact brand header — same logo asset used across all in-app screens
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import AppLogo from './AppLogo';

interface Props {
  /** Screen title shown beside the logo (e.g. "Alarm Settings") */
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Center the brand mark when no back button (Home, Confirmation) */
  centered?: boolean;
}

export default function AppBrandBar({
  title,
  showBack = false,
  onBack,
  centered = false,
}: Props) {
  const brand = (
    <View style={styles.brand}>
      <AppLogo size="sm" elevated />
      <View style={styles.textCol}>
        <Text style={styles.appName}>FAJR COMPANION</Text>
        {title ? <Text style={styles.screenTitle}>{title}</Text> : null}
      </View>
    </View>
  );

  if (centered && !showBack) {
    return <View style={styles.centeredWrap}>{brand}</View>;
  }

  return (
    <View style={styles.bar}>
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <View style={styles.center}>{brand}</View>

      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  centeredWrap:    { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:         { width: 32 },
  backPlaceholder: { width: 32 },
  center:          { flex: 1, alignItems: 'center' },
  brand:           { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol:         { gap: 1 },
  appName:         { fontSize: 9, fontWeight: '500', color: Colors.headerText, letterSpacing: 2.5 },
  screenTitle:     { fontSize: 13, fontWeight: '500', color: Colors.white },
});
