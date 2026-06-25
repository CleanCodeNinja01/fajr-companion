// Alarm settings: offset, snooze, sound, and reset
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList, WakeOffset } from '../types';
import { useAlarmSettings } from '../hooks/useAlarmSettings';
import { WAKE_OFFSETS } from '../constants/Defaults';
import { resetAllData } from '../services/storage';
import { cancelAllAlarms } from '../services/alarmService';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'AlarmSettings'> };

export default function AlarmSettingsScreen({ navigation }: Props) {
  const { settings, update } = useAlarmSettings();

  function handleReset() {
    Alert.alert(
      'Start Over',
      'This will clear all your data — streak, settings, and alarm — and take you back to onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cancelAllAlarms();
            await resetAllData();
            navigation.replace('Onboarding');
          },
        },
      ],
    );
  }

  function clampSnooze(val: number) {
    return Math.min(5, Math.max(1, val));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alarm Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Wake offset */}
        <Text style={styles.sectionLabel}>WAKE-UP OFFSET</Text>
        <View style={styles.card}>
          {WAKE_OFFSETS.map((o, idx) => (
            <TouchableOpacity
              key={o.value}
              style={[styles.radioRow, idx < WAKE_OFFSETS.length - 1 && styles.rowBorder]}
              onPress={() => update({ offset: o.value as WakeOffset })}
              activeOpacity={0.7}
            >
              <Text style={styles.radioLabel}>{o.label}</Text>
              <View style={[styles.radio, settings.offset === o.value && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Snooze */}
        <Text style={styles.sectionLabel}>SNOOZE</Text>
        <View style={styles.card}>
          <View style={[styles.radioRow, styles.rowBorder]}>
            <Text style={styles.radioLabel}>Enable snooze</Text>
            <Switch
              value={settings.snoozeEnabled}
              onValueChange={v => update({ snoozeEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.white}
            />
          </View>
          {settings.snoozeEnabled && (
            <View style={styles.radioRow}>
              <Text style={styles.radioLabel}>Max snoozes</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => update({ maxSnoozes: clampSnooze(settings.maxSnoozes - 1) })}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepCount}>{settings.maxSnoozes}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => update({ maxSnoozes: clampSnooze(settings.maxSnoozes + 1) })}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Sound */}
        <Text style={styles.sectionLabel}>ALARM SOUND</Text>
        <View style={styles.card}>
          {(['adhan', 'gentle'] as const).map((s, idx) => (
            <TouchableOpacity
              key={s}
              style={[styles.radioRow, idx === 0 && styles.rowBorder]}
              onPress={() => update({ soundType: s })}
              activeOpacity={0.7}
            >
              <View style={styles.soundRow}>
                <Ionicons
                  name={s === 'adhan' ? 'musical-notes-outline' : 'volume-low-outline'}
                  size={16}
                  color={Colors.accent}
                />
                <Text style={styles.radioLabel}>
                  {s === 'adhan' ? 'Adhan' : 'Gentle tone'}
                </Text>
              </View>
              <View style={[styles.radio, settings.soundType === s && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>

        {/* Reset — clears all data and returns to onboarding */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.resetBtnText}>Start Over / Reset App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:   { fontSize: 15, fontWeight: '500', color: Colors.textDark },
  body:          { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel:  { fontSize: 10, fontWeight: '500', color: Colors.textMuted, letterSpacing: 0.6, marginTop: 6 },
  card:          { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 0.5, borderColor: Colors.border, paddingHorizontal: 14 },
  radioRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  rowBorder:     { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  radioLabel:    { fontSize: 13, color: Colors.textDark },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.border },
  radioActive:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepper:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:       { width: 28, height: 28, borderRadius: 8, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:   { fontSize: 16, color: Colors.textMuted },
  stepCount:     { fontSize: 15, fontWeight: '500', color: Colors.textDark, minWidth: 20, textAlign: 'center' },
  soundRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtn:       { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText:   { fontSize: 15, fontWeight: '500', color: Colors.white },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  resetBtnText:  { fontSize: 12, color: Colors.textMuted },
});
