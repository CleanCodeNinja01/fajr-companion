// First-launch screen: requests location + notification permissions
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import SplashHero from '../components/SplashHero';
import StarfieldBackground from '../components/StarfieldBackground';
import CityAutocomplete from '../components/CityAutocomplete';
import { RootStackParamList, CitySuggestion, LocationData } from '../types';
import {
  getCurrentLocation,
  geocodeCity,
  openLocationSettings,
  suggestionToLocation,
  getLocationPermissionStatus,
  requestLocationPermission,
} from '../services/locationService';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '../services/alarmService';
import { saveLocation, setOnboardingDone, getAlarmSettings, saveAlarmSettings } from '../services/storage';
import { defaultCalculationMethodForCountry } from '../services/prayerTimes';
import { inferCountryFromCityName, withTimezone } from '../services/locationService';
import { track } from '../services/analytics';
import { AnalyticsEvents } from '../constants/AnalyticsEvents';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Onboarding'> };
type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export default function OnboardingScreen({ navigation }: Props) {
  const [loading,              setLoading]              = useState(false);
  const [cityModal,            setCityModal]            = useState(false);
  const [cityInput,            setCityInput]            = useState('');
  const [cityLoading,          setCityLoading]          = useState(false);
  const [locationStatus,       setLocationStatus]       = useState<PermissionStatus>('undetermined');
  const [notificationStatus,   setNotificationStatus]   = useState<PermissionStatus>('undetermined');
  const [locationLoading,      setLocationLoading]      = useState(false);
  const [notificationLoading,  setNotificationLoading]  = useState(false);

  const refreshPermissionStatus = useCallback(async () => {
    const [loc, notif] = await Promise.all([
      getLocationPermissionStatus(),
      getNotificationPermissionStatus(),
    ]);
    setLocationStatus(loc);
    setNotificationStatus(notif);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermissionStatus();
    }, [refreshPermissionStatus]),
  );

  function showOpenSettingsAlert(kind: 'location' | 'notifications') {
    Alert.alert(
      kind === 'location' ? 'Location permission needed' : 'Notifications disabled',
      kind === 'location'
        ? 'Allow location access in Settings so Fajr Companion can detect your city.'
        : 'Allow notifications in Settings so your Fajr alarm can ring.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openLocationSettings() },
      ],
    );
  }

  async function handleLocationPress() {
    if (locationLoading) return;
    if (locationStatus === 'granted') return;
    if (locationStatus === 'denied') {
      showOpenSettingsAlert('location');
      return;
    }

    setLocationLoading(true);
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        setLocationStatus('granted');
        try {
          const loc = await getCurrentLocation({ fresh: true });
          await saveLocation(loc);
        } catch {
          // Permission granted but GPS lookup failed — user can enter city manually
        }
      } else {
        setLocationStatus(await getLocationPermissionStatus());
      }
    } finally {
      setLocationLoading(false);
    }
  }

  async function handleNotificationPress() {
    if (notificationLoading) return;
    if (notificationStatus === 'granted') return;
    if (notificationStatus === 'denied') {
      showOpenSettingsAlert('notifications');
      return;
    }

    setNotificationLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setNotificationStatus(granted ? 'granted' : await getNotificationPermissionStatus());
    } finally {
      setNotificationLoading(false);
    }
  }

  function permissionBadge(status: PermissionStatus) {
    switch (status) {
      case 'granted':
        return { label: 'Allowed', style: styles.badgeGranted, textStyle: styles.badgeGrantedText };
      case 'denied':
        return { label: 'Denied', style: styles.badgeDenied, textStyle: styles.badgeDeniedText };
      default:
        return { label: 'Tap to allow', style: styles.badge, textStyle: styles.badgeText };
    }
  }

  function PermissionBadge({ status, loading }: { status: PermissionStatus; loading: boolean }) {
    if (loading) return <ActivityIndicator size="small" color={Colors.accent} />;
    const badge = permissionBadge(status);
    return (
      <View style={badge.style}>
        <Text style={badge.textStyle}>{badge.label}</Text>
      </View>
    );
  }

  async function handleGetStarted() {
    setLoading(true);
    try {
      if (notificationStatus !== 'granted') {
        await requestNotificationPermission();
        await refreshPermissionStatus();
      }

      try {
        if (locationStatus === 'granted') {
          const loc = withTimezone(await getCurrentLocation({ fresh: true }));
          await applyCalculationMethodForLocation(loc);
          await saveLocation(loc);
        } else {
          const loc = withTimezone(await getCurrentLocation());
          await applyCalculationMethodForLocation(loc);
          await saveLocation(loc);
        }
        await setOnboardingDone();
        void track(AnalyticsEvents.ONBOARDING_COMPLETED, {
          method: 'location',
          location_granted: locationStatus === 'granted',
          notifications_granted: notificationStatus === 'granted',
        });
        navigation.replace('Home');
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '';
        if (message === 'PERMANENTLY_DENIED' || message === 'PERMISSION_DENIED') {
          Alert.alert(
            'Location permission needed',
            'You can allow location in Settings, or enter your city manually.',
            [
              { text: 'Enter city', onPress: () => setCityModal(true) },
              { text: 'Open Settings', onPress: () => openLocationSettings() },
            ],
          );
        } else {
          setCityModal(true);
        }
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function applyCalculationMethodForLocation(loc: LocationData) {
    const country = loc.country ?? inferCountryFromCityName(loc.cityName);
    const alarmSettings = await getAlarmSettings();
    await saveAlarmSettings({
      ...alarmSettings,
      calculationMethod: defaultCalculationMethodForCountry(country),
    });
  }

  async function finishWithLocation(loc: Awaited<ReturnType<typeof getCurrentLocation>>) {
    const enriched = withTimezone(loc);
    await applyCalculationMethodForLocation(enriched);
    await saveLocation(enriched);
    await requestNotificationPermission();
    await setOnboardingDone();
    void track(AnalyticsEvents.ONBOARDING_COMPLETED, {
      method: 'manual_city',
      country: enriched.country ?? inferCountryFromCityName(enriched.cityName) ?? null,
    });
    setCityModal(false);
    navigation.replace('Home');
  }

  async function handleCitySelect(suggestion: CitySuggestion) {
    setCityLoading(true);
    try {
      await finishWithLocation(suggestionToLocation(suggestion));
    } finally {
      setCityLoading(false);
    }
  }

  async function handleCitySubmit() {
    if (!cityInput.trim()) return;
    setCityLoading(true);
    try {
      const loc = await geocodeCity(cityInput.trim());
      await finishWithLocation(loc);
    } catch {
      Alert.alert('City not found', 'Please pick a city from the suggestions or check the spelling.');
    } finally {
      setCityLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StarfieldBackground />
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <SplashHero />
        </View>

        {/* ── Permission cards — tap to request ── */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleLocationPress}
          activeOpacity={0.75}
          disabled={locationLoading}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="location-sharp" size={16} color={Colors.gold} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Location</Text>
            <Text style={styles.cardDesc}>Calculates your exact local Fajr time</Text>
          </View>
          <PermissionBadge status={locationStatus} loading={locationLoading} />
          <Ionicons name="chevron-forward" size={13} color="#3D2030" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={handleNotificationPress}
          activeOpacity={0.75}
          disabled={notificationLoading}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="notifications" size={16} color={Colors.gold} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <Text style={styles.cardDesc}>Rings the alarm at the right moment</Text>
          </View>
          <PermissionBadge status={notificationStatus} loading={notificationLoading} />
          <Ionicons name="chevron-forward" size={13} color="#3D2030" />
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* ── CTA ── */}
        <TouchableOpacity style={styles.btn} onPress={handleGetStarted} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Get Started</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCityModal(true)} style={styles.manualLink}>
          <Text style={styles.manualText}>Enter city manually instead</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── City modal ── */}
      <Modal visible={cityModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter your city</Text>
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
            <TouchableOpacity onPress={() => setCityModal(false)} style={styles.manualLink}>
              <Text style={styles.manualText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── dark palette constants ───────────────────────────────────────────────────
const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.darkBg },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32 },
  heroWrap:  { marginBottom: 44 },

  // Permission cards
  card:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                 backgroundColor: CARD_BG, borderRadius: 16,
                 borderWidth: 0.5, borderColor: CARD_BDR,
                 padding: 14, marginBottom: 10 },
  cardIconWrap:{ width: 38, height: 38, borderRadius: 11,
                 backgroundColor: Colors.darkBg,
                 alignItems: 'center', justifyContent: 'center',
                 borderWidth: 0.5, borderColor: CARD_BDR },
  cardBody:    { flex: 1 },
  cardTitle:   { fontSize: 13, fontWeight: '500', color: Colors.white, marginBottom: 2 },
  cardDesc:    { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  // Permission badges (undetermined / granted / denied)
  badge:            { backgroundColor: '#2A1520', borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:        { fontSize: 10, color: Colors.accent, fontWeight: '500' },
  badgeGranted:     { backgroundColor: '#112A1A', borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 3 },
  badgeGrantedText: { fontSize: 10, color: '#4CAF82', fontWeight: '500' },
  badgeDenied:      { backgroundColor: '#2A1010', borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 3 },
  badgeDeniedText:  { fontSize: 10, color: '#E07070', fontWeight: '500' },

  // Bottom
  spacer:     { flex: 1, minHeight: 32 },
  btn:        { backgroundColor: Colors.accent, borderRadius: 14,
                paddingVertical: 15, alignItems: 'center' },
  btnText:    { fontSize: 15, fontWeight: '500', color: Colors.white, letterSpacing: 0.3 },
  manualLink: { alignItems: 'center', paddingVertical: 14 },
  manualText: { fontSize: 12, color: Colors.textMuted },

  // City modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: CARD_BG, borderTopLeftRadius: 24,
                  borderTopRightRadius: 24, padding: 28, paddingBottom: 44,
                  borderTopWidth: 0.5, borderColor: CARD_BDR },
  modalTitle:   { fontSize: 17, fontWeight: '500', color: Colors.white, marginBottom: 16 },
});
