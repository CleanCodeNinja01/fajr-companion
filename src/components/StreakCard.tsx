// Displays the user's current Fajr streak count
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

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
    backgroundColor: Colors.light,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  count: {
    fontSize: 48,
    fontWeight: '500',
    color: Colors.primary,
    lineHeight: 56,
  },
  sub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
