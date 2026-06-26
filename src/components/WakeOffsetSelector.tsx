// Pill selector for wake-up offset before Fajr
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { WakeOffset } from '../types';
import { WAKE_OFFSETS } from '../constants/Defaults';

const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

interface Props {
  selected: WakeOffset;
  onChange: (value: WakeOffset) => void;
}

export default function WakeOffsetSelector({ selected, onChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Wake me up</Text>
      <View style={styles.pills}>
        {WAKE_OFFSETS.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[styles.pill, selected === o.value && styles.pillActive]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, selected === o.value && styles.pillTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: CARD_BDR,
    padding: 12,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: Colors.darkBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: CARD_BDR,
  },
  pillActive: {
    backgroundColor: 'rgba(232,168,95,0.18)',
    borderColor: Colors.gold,
  },
  pillText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  pillTextActive: {
    color: Colors.gold,
    fontWeight: '500',
  },
});
