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
import AppLogo from '../components/AppLogo';
import CityAutocomplete from '../components/CityAutocomplete';
import { RootStackParamList, CitySuggestion } from '../types';
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
import { saveLocation, setOnboardingDone } from '../services/storage';

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
          const loc = await getCurrentLocation({ fresh: true });
          await saveLocation(loc);
        } else {
          const loc = await getCurrentLocation();
          await saveLocation(loc);
        }
        await setOnboardingDone();
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

  async function finishWithLocation(loc: Awaited<ReturnType<typeof getCurrentLocation>>) {
    await saveLocation(loc);
    await requestNotificationPermission();
    await setOnboardingDone();
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
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <AppLogo size="lg" />
          <Text style={styles.title}>Fajr Companion</Text>
          <Text style={styles.subtitle}>Never miss Fajr.{'\n'}Simple, clean, and purposeful.</Text>
        </View>

        {/* Permission cards — tap to request each permission */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleLocationPress}
          activeOpacity={0.8}
          disabled={locationLoading}
        >
          <View style={styles.cardRow}>
            <Ionicons name="location-sharp" size={14} color={Colors.accent} />
            <Text style={styles.cardTitle}>Location</Text>
            <PermissionBadge status={locationStatus} loading={locationLoading} />
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
          <Text style={styles.cardDesc}>To calculate your exact local Fajr time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={handleNotificationPress}
          activeOpacity={0.8}
          disabled={notificationLoading}
        >
          <View style={styles.cardRow}>
            <Ionicons name="notifications" size={14} color={Colors.accent} />
            <Text style={styles.cardTitle}>Notifications</Text>
            <PermissionBadge status={notificationStatus} loading={notificationLoading} />
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
          <Text style={styles.cardDesc}>To ring your alarm at the right moment</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* CTA */}
        <TouchableOpacity style={styles.btn} onPress={handleGetStarted} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Get Started</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setCityModal(true)} style={styles.manualLink}>
          <Text style={styles.manualText}>Enter city manually instead</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* City input modal */}
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
            <TouchableOpacity style={styles.btn} onPress={handleCitySubmit} disabled={cityLoading || !cityInput.trim()} activeOpacity={0.85}>
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

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  container:    { flexGrow: 1, padding: 24, paddingTop: 32 },
  logoArea:     { alignItems: 'center', marginBottom: 32, gap: 12 },
  title:        { fontSize: 24, fontWeight: '500', color: Colors.textDark },
  subtitle:     { fontSize: 13, color: Colors.textMuted, lineHeight: 20, textAlign: 'center' },
  card:         { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 0.5, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  cardTitle:    { fontSize: 13, fontWeight: '500', color: Colors.textDark, flex: 1 },
  cardDesc:     { fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
  badge:            { backgroundColor: Colors.light, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:        { fontSize: 10, color: Colors.primary, fontWeight: '500' },
  badgeGranted:     { backgroundColor: '#E6F4EA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeGrantedText: { fontSize: 10, color: '#2E7D4F', fontWeight: '500' },
  badgeDenied:      { backgroundColor: '#FCEAEA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeDeniedText:  { fontSize: 10, color: '#B54545', fontWeight: '500' },
  spacer:       { flex: 1, minHeight: 24 },
  btn:          { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:      { fontSize: 15, fontWeight: '500', color: Colors.white },
  manualLink:   { alignItems: 'center', paddingVertical: 14 },
  manualText:   { fontSize: 12, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 16, fontWeight: '500', color: Colors.textDark, marginBottom: 14 },
});
