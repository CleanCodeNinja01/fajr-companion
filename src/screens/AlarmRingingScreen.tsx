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
import { track } from '../services/analytics';
import { AnalyticsEvents } from '../constants/AnalyticsEvents';
import StarfieldBackground from '../components/StarfieldBackground';
import AppBrandBar from '../components/AppBrandBar';
import AppLogo from '../components/AppLogo';

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
    void track(AnalyticsEvents.ALARM_AWAKE);
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
    void track(AnalyticsEvents.ALARM_SNOOZED, { snoozes_remaining: snoozeLeft - 1 });
    navigation.replace('Home');
  }

  async function handleBack() {
    await stopAlarmSound();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Home');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StarfieldBackground />

      <AppBrandBar showBack onBack={handleBack} />

      <View style={styles.content}>
        <AppLogo size="md" elevated />
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
  content:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  divider:       { width: 28, height: 1, backgroundColor: Colors.gold, marginVertical: 4 },
  title:         { fontSize: 18, fontWeight: '400', color: Colors.white, marginBottom: 10, textAlign: 'center', letterSpacing: 0.3 },
  quote:         { fontSize: 13, color: Colors.headerText, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  snoozeInfo:    { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 16 },
  buttons:       { padding: 24, gap: 10 },
  awakeBtn:      { backgroundColor: Colors.light, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  awakeBtnText:  { fontSize: 16, fontWeight: '500', color: Colors.darkBg },
  snoozeBtn:     { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#3D2030' },
  snoozeBtnText: { fontSize: 14, color: Colors.textMuted },
});
