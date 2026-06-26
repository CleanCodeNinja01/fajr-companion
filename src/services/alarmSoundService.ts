// Play / stop alarm audio (Fajr adhan or gentle tone)
import { Audio, AVPlaybackSource } from 'expo-av';
import { SoundType } from '../types';

// Makkah Fajr adhan (Masjid al-Haram) — bundled + CDN fallbacks
const FAJR_ADHAN_SOURCES: AVPlaybackSource[] = [
  require('../../assets/adhan.mp3'),
  {
    uri: 'https://archive.org/download/MakkahFajrAdhan6913SheikhAliMullah/Makkah%20Fajr%20Adhan%206-9-13%20Sheikh%20Ali%20Mullah.mp3',
  },
  { uri: 'https://cdn.aladhan.com/audio/adhans/fajr/f2-mansour-al-zahrani.mp3' },
];

const GENTLE_SOURCES: AVPlaybackSource[] = [
  require('../../assets/gentle-alarm.mp3'),
  { uri: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
  { uri: 'https://assets.mixkit.co/active_storage/sfx/935/935-preview.mp3' },
];

let activeSound: Audio.Sound | null = null;

async function clearActiveSound(): Promise<void> {
  if (!activeSound) return;
  const sound = activeSound;
  activeSound = null;
  try {
    await sound.stopAsync();
    await sound.unloadAsync();
  } catch {
    // ignore
  }
}

async function configureAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}

async function trySources(
  sources: AVPlaybackSource[],
  loop: boolean,
  onFinish?: () => void,
): Promise<Audio.Sound | null> {
  for (const source of sources) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true, isLooping: loop, volume: 1.0 },
      );
      if (!loop && onFinish) {
        sound.setOnPlaybackStatusUpdate(status => {
          if (!status.isLoaded || !status.didJustFinish) return;
          void clearActiveSound().then(onFinish);
        });
      }
      return sound;
    } catch {
      // try next source
    }
  }
  return null;
}

export async function playAlarmSound(
  soundType: SoundType,
  loop = true,
  onFinish?: () => void,
): Promise<boolean> {
  await clearActiveSound();
  await configureAudioMode();

  const sources = soundType === 'adhan' ? FAJR_ADHAN_SOURCES : GENTLE_SOURCES;
  const sound = await trySources(sources, loop, onFinish);
  if (!sound) return false;

  activeSound = sound;
  return true;
}

export async function previewAlarmSound(
  soundType: SoundType,
  onFinish?: () => void,
): Promise<boolean> {
  return playAlarmSound(soundType, false, onFinish);
}

export async function stopAlarmSound(): Promise<void> {
  await clearActiveSound();
}
