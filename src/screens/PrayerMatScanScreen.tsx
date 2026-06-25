// Camera screen: user takes a photo of their prayer mat as proof
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types';
import { useStreak } from '../hooks/useStreak';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'PrayerMatScan'> };

export default function PrayerMatScanScreen({ navigation }: Props) {
  const [photos,  setPhotos]  = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { incrementStreak }   = useStreak();

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
      setPhotos(prev => [...prev.slice(0, 2), result.assets[0].uri]);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await incrementStreak();
      navigation.replace('Confirmation');
    } catch {
      Alert.alert('Error', 'Could not save confirmation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Camera viewfinder area */}
      <View style={styles.viewfinder}>
        <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.8}>
          <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.4)" />
          <Text style={styles.cameraHint}>Tap to take photo</Text>
        </TouchableOpacity>
        {/* Corner guides */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Text style={styles.viewfinderHint}>Point at your prayer mat</Text>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Verify you're awake</Text>
        <Text style={styles.subtitle}>
          Take a quick photo of your prayer mat. No AI — just your proof.
        </Text>

        {/* Photo thumbnails */}
        <View style={styles.photoRow}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} style={styles.photoSlot} onPress={takePhoto} activeOpacity={0.8}>
              {photos[i] ? (
                <Image source={{ uri: photos[i] }} style={styles.photoThumb} />
              ) : (
                <Ionicons
                  name={i < photos.length ? 'image-outline' : 'add-outline'}
                  size={22}
                  color={i < photos.length ? Colors.primary : Colors.border}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, photos.length === 0 && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={photos.length === 0 || loading}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            {loading ? 'Saving...' : "Confirm I'm up for Fajr"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 20;
const CORNER_W    = 2.5;

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  viewfinder:         { height: 220, backgroundColor: Colors.darkBg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cameraBtn:          { alignItems: 'center', gap: 8 },
  cameraHint:         { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  viewfinderHint:     { position: 'absolute', bottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  corner:             { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: Colors.gold },
  topLeft:            { top: 12, left: 12, borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W },
  topRight:           { top: 12, right: 12, borderTopWidth: CORNER_W, borderRightWidth: CORNER_W },
  bottomLeft:         { bottom: 12, left: 12, borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W },
  bottomRight:        { bottom: 12, right: 12, borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W },
  body:               { padding: 20, gap: 12 },
  title:              { fontSize: 17, fontWeight: '500', color: Colors.textDark },
  subtitle:           { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  photoRow:           { flexDirection: 'row', gap: 10 },
  photoSlot:          { flex: 1, height: 72, backgroundColor: Colors.light, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumb:         { width: '100%', height: '100%' },
  confirmBtn:         { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmBtnDisabled: { backgroundColor: Colors.border },
  confirmBtnText:     { fontSize: 15, fontWeight: '500', color: Colors.white },
});
