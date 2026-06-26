// Alarm settings: offset, snooze, sound, and reset
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList, WakeOffset, SoundType } from '../types';
import { useAlarmSettings } from '../hooks/useAlarmSettings';
import { WAKE_OFFSETS } from '../constants/Defaults';
import { resetAllData, getLocation } from '../services/storage';
import { cancelAllAlarms } from '../services/alarmService';
import { rescheduleFajrAlarmIfEnabled } from '../services/alarmScheduling';
import { withTimezone } from '../services/locationService';
import { previewAlarmSound, stopAlarmSound } from '../services/alarmSoundService';
import StarfieldBackground from '../components/StarfieldBackground';

const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'AlarmSettings'> };

export default function AlarmSettingsScreen({ navigation }: Props) {
  const { settings, update } = useAlarmSettings();
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => () => { void stopAlarmSound(); }, []);

  async function handlePreview() {
    if (previewing) {
      await stopAlarmSound();
      setPreviewing(false);
      return;
    }
    const ok = await previewAlarmSound(settings.soundType, () => setPreviewing(false));
    if (!ok) {
      Alert.alert('Could not play sound', 'Check your volume and try again.');
      return;
    }
    setPreviewing(true);
  }

  async function handleSoundChange(soundType: SoundType) {
    await update({ soundType });
    if (previewing) {
      await stopAlarmSound();
      const ok = await previewAlarmSound(soundType);
      if (!ok) setPreviewing(false);
    }
  }

  async function handleOffsetChange(offset: WakeOffset) {
    await update({ offset });
    const loc = await getLocation();
    await rescheduleFajrAlarmIfEnabled(
      { ...settings, offset },
      loc ? withTimezone(loc) : null,
    );
  }

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
      <StarfieldBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.light} />
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
              onPress={() => handleOffsetChange(o.value as WakeOffset)}
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
              trackColor={{ false: CARD_BDR, true: Colors.accent }}
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
              onPress={() => handleSoundChange(s)}
              activeOpacity={0.7}
            >
              <View style={styles.soundRow}>
                <Ionicons
                  name={s === 'adhan' ? 'musical-notes-outline' : 'volume-low-outline'}
                  size={16}
                  color={Colors.gold}
                />
                <Text style={styles.radioLabel}>
                  {s === 'adhan' ? 'Makkah Fajr Adhan' : 'Gentle alarm'}
                </Text>
              </View>
              <View style={[styles.radio, settings.soundType === s && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.previewBtn} onPress={handlePreview} activeOpacity={0.85}>
          <Ionicons
            name={previewing ? 'stop-circle-outline' : 'play-circle-outline'}
            size={18}
            color={Colors.gold}
          />
          <Text style={styles.previewBtnText}>
            {previewing ? 'Stop preview' : 'Play preview'}
          </Text>
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={async () => {
              if (previewing) {
                await stopAlarmSound();
                setPreviewing(false);
              }
              navigation.navigate('AlarmRinging');
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="bug-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.devBtnText}>Open alarm screen (dev)</Text>
          </TouchableOpacity>
        )}

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
  safe:          { flex: 1, backgroundColor: Colors.darkBg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:   { fontSize: 15, fontWeight: '500', color: Colors.white },
  body:          { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel:  { fontSize: 10, fontWeight: '500', color: Colors.textMuted, letterSpacing: 0.6, marginTop: 6 },
  card:          { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 0.5, borderColor: CARD_BDR, paddingHorizontal: 14 },
  radioRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  rowBorder:     { borderBottomWidth: 0.5, borderBottomColor: CARD_BDR },
  radioLabel:    { fontSize: 13, color: Colors.white },
  radio:         { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: CARD_BDR },
  radioActive:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepper:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:       { width: 28, height: 28, borderRadius: 8, borderWidth: 0.5, borderColor: CARD_BDR, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:   { fontSize: 16, color: Colors.textMuted },
  stepCount:     { fontSize: 15, fontWeight: '500', color: Colors.white, minWidth: 20, textAlign: 'center' },
  soundRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                   paddingVertical: 12, marginTop: 4 },
  previewBtnText:{ fontSize: 13, color: Colors.gold, fontWeight: '500' },
  devBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                   paddingVertical: 10, marginTop: 2 },
  devBtnText:    { fontSize: 12, color: Colors.textMuted },
  saveBtn:       { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText:   { fontSize: 15, fontWeight: '500', color: Colors.white },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  resetBtnText:  { fontSize: 12, color: Colors.textMuted },
});
