// Displays the user's current Fajr streak count
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

interface Props {
  count: number;
}

export default function StreakCard({ count }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Fajr streak</Text>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.sub}>days in a row</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: CARD_BDR,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  count: {
    fontSize: 48,
    fontWeight: '500',
    color: Colors.gold,
    lineHeight: 56,
  },
  sub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
