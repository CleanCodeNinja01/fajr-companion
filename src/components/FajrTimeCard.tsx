// Header card showing the next upcoming Fajr time, location, and the other day
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { formatTime, formatDate, resolveFajrDisplay } from '../services/prayerTimes';
import StarfieldBackground from './StarfieldBackground';

interface Props {
  todayFajr:    Date | null;
  tomorrowFajr: Date | null;
  cityName:     string | undefined;
  timeZone:     string | undefined;
  loading:      boolean;
}

export default function FajrTimeCard({ todayFajr, tomorrowFajr, cityName, timeZone, loading }: Props) {
  const [nowMs, setNowMs] = useState(Date.now());

  // Re-evaluate when today's Fajr passes (check every minute)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const display = useMemo(
    () => resolveFajrDisplay(todayFajr, tomorrowFajr, nowMs),
    [todayFajr, tomorrowFajr, nowMs],
  );

  const secondaryText =
    display.secondary && display.secondaryLabel
      ? `${display.secondaryLabel}: ${formatTime(display.secondary, timeZone)}`
      : '';

  return (
    <View style={styles.header}>
      <StarfieldBackground />
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={11} color={Colors.gold} />
        <Text style={styles.location}>{cityName ?? 'Locating...'}</Text>
      </View>
      <Text style={styles.label}>{display.primaryLabel}</Text>
      <Text style={styles.time}>
        {loading ? '--:--' : display.primary ? formatTime(display.primary, timeZone) : '--:--'}
      </Text>
      <View style={styles.row}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>
            {display.primary
              ? formatDate(display.primary, timeZone)
              : formatDate(new Date(), timeZone)}
          </Text>
        </View>
        {secondaryText ? (
          <Text style={styles.secondary}>{secondaryText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.darkBg,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: Colors.gold,
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
    backgroundColor: 'rgba(232,168,95,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(232,168,95,0.3)',
  },
  dateBadgeText: {
    fontSize: 10,
    color: Colors.gold,
  },
  secondary: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
