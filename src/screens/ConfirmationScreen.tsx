// Success screen: streak count + morning checklist
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { useStreak } from '../hooks/useStreak';
import { getChecklist, saveChecklist } from '../services/storage';
import { toISODate } from '../services/prayerTimes';
import StreakCard from '../components/StreakCard';
import MorningChecklist from '../components/MorningChecklist';
import StarfieldBackground from '../components/StarfieldBackground';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Confirmation'> };

const TODAY = toISODate(new Date());

export default function ConfirmationScreen({ navigation }: Props) {
  const { streak }  = useStreak();
  const [checked, setChecked] = useState<Record<string, boolean>>({ pray: true });

  useEffect(() => {
    getChecklist(TODAY).then(saved => {
      setChecked({ pray: true, ...saved });
    });
  }, []);

  async function toggleItem(key: string) {
    if (key === 'pray') return; // Fajr always checked on this screen
    const updated = { ...checked, [key]: !checked[key] };
    setChecked(updated);
    await saveChecklist(TODAY, updated);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StarfieldBackground />
      <ScrollView contentContainerStyle={styles.body}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.gold} />
        </View>
        <Text style={styles.title}>Alhamdulillah</Text>
        <Text style={styles.subtitle}>You woke up for Fajr today.</Text>

        <StreakCard count={streak.count} />
        <MorningChecklist checked={checked} onToggle={toggleItem} />

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.replace('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.darkBg },
  body:       { padding: 24, gap: 14, alignItems: 'center', paddingBottom: 40 },
  iconWrap:   { width: 64, height: 64, backgroundColor: 'rgba(232,168,95,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(232,168,95,0.3)' },
  title:      { fontSize: 22, fontWeight: '500', color: Colors.white },
  subtitle:   { fontSize: 13, color: Colors.textMuted, marginTop: -6 },
  doneBtn:    { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', width: '100%', marginTop: 4 },
  doneBtnText: { fontSize: 15, fontWeight: '500', color: Colors.white },
});
