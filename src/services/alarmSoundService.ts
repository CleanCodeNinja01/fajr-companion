// Play / stop alarm audio (Fajr adhan or gentle tone)
import { Audio } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';
import type { SoundType } from '../types';

let activeSound: Audio.Sound | null = null;

function fajrAdhanSources(): AVPlaybackSource[] {
  return [require('../../assets/adhan.mp3')];
}

function gentleSources(): AVPlaybackSource[] {
  return [
    require('../../assets/gentle-alarm.mp3'),
    { uri: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
    { uri: 'https://assets.mixkit.co/active_storage/sfx/935/935-preview.mp3' },
  ];
}

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

async function configureAudioMode(): Promise<void> {
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

  const sources = soundType === 'adhan' ? fajrAdhanSources() : gentleSources();
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
