// Main screen: shows Fajr time for selected city, alarm toggle, and offset picker
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Alert, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { RootStackParamList, WakeOffset, LocationData, CitySuggestion } from '../types';
import FajrTimeCard from '../components/FajrTimeCard';
import WakeOffsetSelector from '../components/WakeOffsetSelector';
import StarfieldBackground from '../components/StarfieldBackground';
import CityAutocomplete from '../components/CityAutocomplete';
import { useAlarmSettings } from '../hooks/useAlarmSettings';
import { useFajrTime } from '../hooks/useFajrTime';
import { geocodeCity, getCurrentLocation, openLocationSettings, suggestionToLocation, inferCountryFromCityName, withTimezone } from '../services/locationService';
import { defaultCalculationMethodForCountry, getFajrTime, getLocalCalendarDate, resolveFajrDisplay } from '../services/prayerTimes';
import {
  scheduleAlarm, cancelAllAlarms,
  requestNotificationPermission,
} from '../services/alarmService';
import {
  getLocation, saveLocation,
  saveNotificationId, clearNotificationId,
} from '../services/storage';

const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { settings, loading: settingsLoading, update } = useAlarmSettings();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { todayFajr, tomorrowFajr, loading: fajrLoading } = useFajrTime(
    settings.calculationMethod,
    location,
  );
  const nextFajr = useMemo(
    () => resolveFajrDisplay(todayFajr, tomorrowFajr, nowMs).primary,
    [todayFajr, tomorrowFajr, nowMs],
  );

  const [cityModal,   setCityModal]   = useState(false);
  const [cityInput,   setCityInput]   = useState('');
  const [cityLoading, setCityLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getLocation().then(async raw => {
        const loc = raw ? withTimezone(raw) : null;
        if (loc && loc.timezone !== raw?.timezone) {
          await saveLocation(loc);
        }
        setLocation(loc);
        if (!loc || settingsLoading) return;

        const country = loc.country ?? inferCountryFromCityName(loc.cityName);
        const suggested = defaultCalculationMethodForCountry(country);
        if (country && settings.calculationMethod !== suggested) {
          await update({ calculationMethod: suggested });
        }
      });
    }, [settings.calculationMethod, settingsLoading, update]),
  );

  async function syncCalculationMethod(loc: LocationData) {
    const country = loc.country ?? inferCountryFromCityName(loc.cityName);
    const method = defaultCalculationMethodForCountry(country);
    if (settings.calculationMethod !== method) {
      await update({ calculationMethod: method });
    }
    return method;
  }

  async function rescheduleAlarm(fajrTime: Date, offset: WakeOffset) {
    await cancelAllAlarms();
    const id = await scheduleAlarm(fajrTime, offset);
    await saveNotificationId(id);
  }

  async function toggleAlarm(enabled: boolean) {
    await update({ enabled });
    if (enabled && nextFajr) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Notifications disabled', 'Enable notifications in Settings to use the alarm.');
        await update({ enabled: false });
        return;
      }
      await rescheduleAlarm(nextFajr, settings.offset);
    } else {
      await cancelAllAlarms();
      await clearNotificationId();
    }
  }

  async function changeOffset(offset: WakeOffset) {
    await update({ offset });
    if (settings.enabled && nextFajr) {
      await rescheduleAlarm(nextFajr, offset);
    }
  }

  async function applyLocation(loc: LocationData) {
    const enriched = withTimezone(loc);
    const method = await syncCalculationMethod(enriched);
    await saveLocation(enriched);
    setLocation(enriched);
    setCityModal(false);
    setCityInput('');

    if (settings.enabled) {
      const tz = enriched.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tf = getFajrTime(
        enriched.latitude,
        enriched.longitude,
        method,
        getLocalCalendarDate(tz),
        enriched.country,
      );
      const tmf = getFajrTime(
        enriched.latitude,
        enriched.longitude,
        method,
        getLocalCalendarDate(tz, 1),
        enriched.country,
      );
      const fajr = resolveFajrDisplay(tf, tmf).primary;
      if (fajr) await rescheduleAlarm(fajr, settings.offset);
    }
  }

  async function handleCitySelect(suggestion: CitySuggestion) {
    setCityLoading(true);
    try {
      await applyLocation(suggestionToLocation(suggestion));
    } finally {
      setCityLoading(false);
    }
  }

  async function handleCitySubmit() {
    if (!cityInput.trim()) return;
    setCityLoading(true);
    try {
      const loc = await geocodeCity(cityInput.trim());
      await applyLocation(loc);
    } catch {
      Alert.alert('City not found', 'Please check the spelling and try again.');
    } finally {
      setCityLoading(false);
    }
  }

  async function handleUseCurrentLocation() {
    setCityLoading(true);
    try {
      const loc = await getCurrentLocation({ fresh: true });
      await applyLocation(loc);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'UNKNOWN';
      if (message === 'PERMANENTLY_DENIED' || message === 'PERMISSION_DENIED') {
        Alert.alert(
          'Location permission needed',
          'Allow location access in Settings so Fajr Companion can detect your city.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openLocationSettings() },
          ],
        );
      } else {
        Alert.alert(
          'Could not get location',
          message === 'UNKNOWN'
            ? 'Make sure location is enabled. On the iOS Simulator, set a location via Features → Location.'
            : message,
        );
      }
    } finally {
      setCityLoading(false);
    }
  }

  function openCityPicker() {
    setCityInput(location?.cityName ?? '');
    setCityModal(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FajrTimeCard
        todayFajr={todayFajr}
        tomorrowFajr={tomorrowFajr}
        cityName={location?.cityName}
        timeZone={location?.timezone}
        loading={fajrLoading || settingsLoading}
      />

      <View style={styles.scrollContainer}>
        <StarfieldBackground />
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* City */}
          <TouchableOpacity style={styles.card} onPress={openCityPicker} activeOpacity={0.8}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>City</Text>
                <Text style={styles.cardValue} numberOfLines={1}>
                  {location?.cityName ?? 'Select your city'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Alarm toggle */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.cardLabel}>Alarm</Text>
                <Text style={styles.cardValue}>{settings.enabled ? 'Enabled' : 'Disabled'}</Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={toggleAlarm}
                trackColor={{ false: CARD_BDR, true: Colors.accent }}
                thumbColor={Colors.white}
                disabled={!nextFajr}
              />
            </View>
          </View>

          {/* Wake offset */}
          <WakeOffsetSelector selected={settings.offset} onChange={changeOffset} />

          {/* Settings button */}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('AlarmSettings')}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={16} color={Colors.white} />
            <Text style={styles.btnText}>Alarm Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* City picker modal */}
      <Modal visible={cityModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Change city</Text>
              <Text style={styles.modalHint}>Search and pick your city — Fajr time is calculated from its coordinates.</Text>
              <CityAutocomplete
                value={cityInput}
                onChangeText={setCityInput}
                onSelect={handleCitySelect}
                placeholder="e.g. London, Karachi, Dubai"
              />
              <TouchableOpacity
                style={styles.btn}
                onPress={handleCitySubmit}
                disabled={cityLoading || !cityInput.trim()}
                activeOpacity={0.85}
              >
                {cityLoading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.btnText}>Confirm</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                style={styles.secondaryLink}
                disabled={cityLoading}
              >
                <Ionicons name="locate-outline" size={14} color={Colors.accent} />
                <Text style={styles.secondaryText}>Use current location</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCityModal(false)} style={styles.cancelLink}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.darkBg },
  scrollContainer:{ flex: 1, position: 'relative', overflow: 'hidden' },
  body:           { padding: 16, gap: 10, paddingBottom: 32 },
  card:           { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 0.5, borderColor: CARD_BDR, padding: 14 },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel:      { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  cardValue:      { fontSize: 13, fontWeight: '500', color: Colors.white },
  btn:            { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  btnText:        { fontSize: 15, fontWeight: '500', color: Colors.white },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalScroll:    { flexGrow: 1, justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: CARD_BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, borderTopWidth: 0.5, borderTopColor: CARD_BDR },
  modalTitle:     { fontSize: 16, fontWeight: '500', color: Colors.white, marginBottom: 6 },
  modalHint:      { fontSize: 12, color: Colors.textMuted, marginBottom: 10, lineHeight: 18 },
  secondaryLink:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  secondaryText:  { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  cancelLink:     { alignItems: 'center', paddingVertical: 8 },
  cancelText:     { fontSize: 12, color: Colors.textMuted },
});
