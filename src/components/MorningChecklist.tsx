// Post-Fajr morning checklist with persistent toggle state
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const ITEMS = [
  { key: 'pray',    label: 'Pray Fajr' },
  { key: 'adhkar',  label: 'Morning adhkar' },
  { key: 'quran',   label: 'Read Quran' },
  { key: 'dua',     label: 'Make dua' },
];

interface Props {
  checked:   Record<string, boolean>;
  onToggle:  (key: string) => void;
}

export default function MorningChecklist({ checked, onToggle }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Morning checklist</Text>
      {ITEMS.map((item, idx) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.row, idx < ITEMS.length - 1 && styles.rowBorder]}
          onPress={() => onToggle(item.key)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={checked[item.key] ? 'checkbox' : 'square-outline'}
            size={20}
            color={checked[item.key] ? Colors.accent : Colors.border}
          />
          <Text style={[styles.label, checked[item.key] && styles.labelChecked]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textDark,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  labelChecked: {
    color: Colors.textDark,
    fontWeight: '500',
  },
});
