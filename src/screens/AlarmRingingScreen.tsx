// Full-screen alarm: plays adhan, offers "I'm Awake" or Snooze
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { getAlarmSettings, getSnoozeCount, setSnoozeCount, resetSnoozeCount } from '../services/storage';
import { scheduleSnooze } from '../services/alarmService';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'AlarmRinging'> };

// Makkah adhan streamed at runtime — works on any device with internet.
// To use a local file instead, replace with: require('../../assets/adhan.mp3')
const ADHAN_SOURCES = [
  { uri: 'https://cdn.islamic.network/prayer-times/adhan/Makka.mp3' },
  { uri: 'https://www.islamicfinder.org/prayer/adhan_sound_makkah.mp3' },
];

export default function AlarmRingingScreen({ navigation }: Props) {
  const soundRef        = useRef<Audio.Sound | null>(null);
  const [snoozeLeft,    setSnoozeLeft]    = useState(3);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
    playAdhan();
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  async function loadSettings() {
    const s     = await getAlarmSettings();
    const used  = await getSnoozeCount();
    setSnoozeEnabled(s.snoozeEnabled);
    setSnoozeLeft(Math.max(0, s.maxSnoozes - used));
  }

  async function playAdhan() {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Try each source in order, fall back silently if all fail
    for (const source of ADHAN_SOURCES) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          source,
          { shouldPlay: true, isLooping: false },
        );
        soundRef.current = sound;
        return; // success — stop trying
      } catch {
        // try next source
      }
    }
  }

  async function stopAudio() {
    try { await soundRef.current?.stopAsync(); } catch { /* ignore */ }
  }

  async function handleAwake() {
    await stopAudio();
    await resetSnoozeCount();
    navigation.replace('PrayerMatScan');
  }

  async function handleSnooze() {
    if (snoozeLeft <= 0) {
      Alert.alert('No snoozes left', 'Please wake up for Fajr! 🌙');
      return;
    }
    await stopAudio();
    const s    = await getAlarmSettings();
    const used = await getSnoozeCount();
    await setSnoozeCount(used + 1);
    await scheduleSnooze(5);
    setSnoozeLeft(prev => prev - 1);
    // Go back to home while waiting for next notification
    navigation.replace('Home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="alarm-outline" size={36} color={Colors.gold} />
        </View>

        <Text style={styles.title}>It's time for Fajr</Text>
        <Text style={styles.quote}>"Prayer is better than sleep."</Text>

        {snoozeEnabled && (
          <Text style={styles.snoozeInfo}>{snoozeLeft} snooze{snoozeLeft !== 1 ? 's' : ''} remaining</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.awakeBtn} onPress={handleAwake} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.primary} />
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
  safe:          { flex: 1, backgroundColor: Colors.primary },
  content:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap:      { width: 72, height: 72, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title:         { fontSize: 22, fontWeight: '500', color: Colors.white, marginBottom: 10, textAlign: 'center' },
  quote:         { fontSize: 13, color: Colors.headerText, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  snoozeInfo:    { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 16 },
  buttons:       { padding: 24, gap: 10 },
  awakeBtn:      { backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  awakeBtnText:  { fontSize: 16, fontWeight: '500', color: Colors.primary },
  snoozeBtn:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  snoozeBtnText: { fontSize: 14, color: Colors.white },
});
