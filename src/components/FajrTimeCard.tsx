// Header card showing today's Fajr time, location and tomorrow's time
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatTime, formatDate } from '../services/prayerTimes';

interface Props {
  todayFajr:    Date | null;
  tomorrowFajr: Date | null;
  cityName:     string | undefined;
  loading:      boolean;
}

export default function FajrTimeCard({ todayFajr, tomorrowFajr, cityName, loading }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={11} color={Colors.headerText} />
        <Text style={styles.location}>{cityName ?? 'Locating...'}</Text>
      </View>
      <Text style={styles.label}>Today's Fajr</Text>
      <Text style={styles.time}>
        {loading ? '--:--' : todayFajr ? formatTime(todayFajr) : '--:--'}
      </Text>
      <View style={styles.row}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{formatDate(new Date())}</Text>
        </View>
        <Text style={styles.tomorrow}>
          {tomorrowFajr ? `Tomorrow: ${formatTime(tomorrowFajr)}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: Colors.headerText,
  },
  label: {
    fontSize: 12,
    color: Colors.headerText,
    marginBottom: 2,
  },
  time: {
    fontSize: 36,
    fontWeight: '500',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateBadgeText: {
    fontSize: 10,
    color: Colors.white,
  },
  tomorrow: {
    fontSize: 10,
    color: Colors.headerText,
  },
});
