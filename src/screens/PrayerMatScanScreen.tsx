// Camera screen: user takes a photo of their prayer mat as proof
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { useStreak } from '../hooks/useStreak';
import { track } from '../services/analytics';
import { AnalyticsEvents, streakBucket } from '../constants/AnalyticsEvents';
import { verifyPrayerMatPhoto } from '../services/prayerMatVerification';
import StarfieldBackground from '../components/StarfieldBackground';

const CARD_BG  = '#1E0F14';
const CARD_BDR = '#3D2030';

type VerificationState = 'idle' | 'checking' | 'verified' | 'failed';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'PrayerMatScan'> };

export default function PrayerMatScanScreen({ navigation }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationState>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { incrementStreak } = useStreak();

  async function analyzePhoto(uri: string) {
    setVerification('checking');
    setVerificationMessage('');
    const result = await verifyPrayerMatPhoto(uri);
    if (result.verified) {
      setVerification('verified');
      setVerificationMessage(result.message);
      return;
    }
    setVerification('failed');
    setVerificationMessage(result.message);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access denied', 'Enable camera in Settings to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await analyzePhoto(uri);
    }
  }

  const canConfirm =
    verification === 'verified' ||
    (__DEV__ && photoUri !== null && verification !== 'checking');

  async function handleConfirm() {
    if (verification !== 'verified' && !__DEV__) return;
    setLoading(true);
    try {
      const updated = await incrementStreak();
      void track(AnalyticsEvents.FAJR_CONFIRMED, {
        streak_bucket: streakBucket(updated.count),
        mat_verified: verification === 'verified',
      });
      navigation.replace('Confirmation');
    } catch {
      Alert.alert('Error', 'Could not save confirmation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function renderVerificationCard() {
    if (verification === 'idle') return null;

    const isChecking = verification === 'checking';
    const isVerified = verification === 'verified';
    const isFailed = verification === 'failed';

    return (
      <View
        style={[
          styles.verificationCard,
          isVerified && styles.verificationVerified,
          isFailed && styles.verificationFailed,
        ]}
      >
        {isChecking ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : (
          <Ionicons
            name={isVerified ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={isVerified ? Colors.gold : '#E57373'}
          />
        )}
        <View style={styles.verificationTextWrap}>
          <Text style={styles.verificationTitle}>
            {isChecking && 'Checking for prayer mat…'}
            {isVerified && 'Prayer mat verified'}
            {isFailed && 'Not verified yet'}
          </Text>
          {!isChecking && verificationMessage ? (
            <Text style={styles.verificationMessage}>{verificationMessage}</Text>
          ) : null}
        </View>
        {isFailed && (
          <TouchableOpacity onPress={takePhoto} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.retryText}>Retake</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StarfieldBackground />

      {/* Camera viewfinder area */}
      <View style={styles.viewfinder}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.4)" />
            <Text style={styles.cameraHint}>Tap to take photo</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Text style={styles.viewfinderHint}>
          {photoUri ? 'Your photo' : 'Point at your prayer mat'}
        </Text>
        {photoUri && verification !== 'checking' && (
          <TouchableOpacity style={styles.retakeOverlayBtn} onPress={takePhoto} activeOpacity={0.85}>
            <Ionicons name="camera-reverse-outline" size={16} color={Colors.white} />
            <Text style={styles.retakeOverlayText}>Retake</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Verify you're awake</Text>
        <Text style={styles.subtitle}>
          Take a photo of your prayer mat. We'll check the image before you confirm.
        </Text>

        {renderVerificationCard()}

        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canConfirm || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? 'Saving...' : "Confirm I'm up for Fajr"}
          </Text>
        </TouchableOpacity>

        {__DEV__ && photoUri && verification === 'failed' && (
          <Text style={styles.devHint}>Dev: you can still confirm to test the flow</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 20;
const CORNER_W    = 2.5;

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: Colors.darkBg },
  viewfinder:           { height: 220, backgroundColor: '#100810', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 0.5, borderBottomColor: CARD_BDR, overflow: 'hidden' },
  previewImage:         { ...StyleSheet.absoluteFillObject },
  cameraBtn:            { alignItems: 'center', gap: 8 },
  cameraHint:           { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  viewfinderHint:       { position: 'absolute', bottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.55)', zIndex: 2 },
  retakeOverlayBtn:     { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, zIndex: 2 },
  retakeOverlayText:    { fontSize: 11, color: Colors.white, fontWeight: '500' },
  corner:               { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: Colors.gold, zIndex: 2 },
  topLeft:              { top: 12, left: 12, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W },
  topRight:             { top: 12, right: 12, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W },
  bottomLeft:           { bottom: 12, left: 12, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W },
  bottomRight:          { bottom: 12, right: 12, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W },
  body:                 { padding: 20, gap: 12 },
  title:                { fontSize: 17, fontWeight: '500', color: Colors.white },
  subtitle:             { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  verificationCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 0.5, borderColor: CARD_BDR, padding: 14 },
  verificationVerified: { borderColor: 'rgba(232,168,95,0.45)', backgroundColor: 'rgba(232,168,95,0.08)' },
  verificationFailed:   { borderColor: 'rgba(229,115,115,0.35)', backgroundColor: 'rgba(229,115,115,0.06)' },
  verificationTextWrap: { flex: 1, gap: 2 },
  verificationTitle:    { fontSize: 13, fontWeight: '500', color: Colors.white },
  verificationMessage:  { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  retryText:            { fontSize: 12, color: Colors.gold, fontWeight: '500' },
  confirmBtn:           { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmBtnDisabled:   { backgroundColor: CARD_BDR },
  confirmBtnText:       { fontSize: 15, fontWeight: '500', color: Colors.white },
  devHint:              { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
});
