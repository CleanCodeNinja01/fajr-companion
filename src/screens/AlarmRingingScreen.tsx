// Full-screen alarm: plays adhan or gentle tone, offers "I'm Awake" or Snooze
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { getAlarmSettings, getSnoozeCount, setSnoozeCount, resetSnoozeCount } from '../services/storage';
import { scheduleSnooze } from '../services/alarmService';
import { playAlarmSound, stopAlarmSound } from '../services/alarmSoundService';
import StarfieldBackground from '../components/StarfieldBackground';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'AlarmRinging'> };

export default function AlarmRingingScreen({ navigation }: Props) {
  const [snoozeLeft,    setSnoozeLeft]    = useState(3);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
    startAlarmSound();
    return () => { void stopAlarmSound(); };
  }, []);

  async function loadSettings() {
    const s     = await getAlarmSettings();
    const used  = await getSnoozeCount();
    setSnoozeEnabled(s.snoozeEnabled);
    setSnoozeLeft(Math.max(0, s.maxSnoozes - used));
  }

  async function startAlarmSound() {
    const s = await getAlarmSettings();
    const loop = s.soundType !== 'adhan';
    const ok = await playAlarmSound(s.soundType, loop);
    if (!ok) {
      Alert.alert(
        'Could not play alarm sound',
        s.soundType === 'adhan'
          ? 'Check your volume and try again.'
          : 'Check your volume and internet connection, then try again.',
      );
    }
  }

  async function handleAwake() {
    await stopAlarmSound();
    await resetSnoozeCount();
    navigation.replace('PrayerMatScan');
  }

  async function handleSnooze() {
    if (snoozeLeft <= 0) {
      Alert.alert('No snoozes left', 'Please wake up for Fajr! 🌙');
      return;
    }
    await stopAlarmSound();
    const used = await getSnoozeCount();
    await setSnoozeCount(used + 1);
    await scheduleSnooze(5);
    setSnoozeLeft(prev => prev - 1);
    navigation.replace('Home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StarfieldBackground />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alarm-outline" size={36} color={Colors.gold} />
        </View>

        <Text style={styles.arabic}>فجر</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>It's time for Fajr</Text>
        <Text style={styles.quote}>"Prayer is better than sleep."</Text>

        {snoozeEnabled && (
          <Text style={styles.snoozeInfo}>{snoozeLeft} snooze{snoozeLeft !== 1 ? 's' : ''} remaining</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.awakeBtn} onPress={handleAwake} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.darkBg} />
          <Text style={styles.awakeBtnText}>I'm Awake</Text>
        </TouchableOpacity>

        {snoozeEnabled && snoozeLeft > 0 && (
          <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.75}>
            <Text style={styles.snoozeBtnText}>Snooze · 5 min</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.darkBg },
  content:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap:      { width: 72, height: 72, backgroundColor: 'rgba(232,168,95,0.1)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 0.5, borderColor: 'rgba(232,168,95,0.3)' },
  arabic:        { fontSize: 54, fontWeight: '200', color: Colors.light, letterSpacing: 10, includeFontPadding: false },
  divider:       { width: 28, height: 1, backgroundColor: Colors.gold, marginVertical: 12 },
  title:         { fontSize: 18, fontWeight: '400', color: Colors.white, marginBottom: 10, textAlign: 'center', letterSpacing: 0.3 },
  quote:         { fontSize: 13, color: Colors.headerText, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  snoozeInfo:    { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 16 },
  buttons:       { padding: 24, gap: 10 },
  awakeBtn:      { backgroundColor: Colors.light, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  awakeBtnText:  { fontSize: 16, fontWeight: '500', color: Colors.darkBg },
  snoozeBtn:     { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#3D2030' },
  snoozeBtnText: { fontSize: 14, color: Colors.textMuted },
});
