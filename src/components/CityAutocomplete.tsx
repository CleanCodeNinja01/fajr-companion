// Debounced city search with worldwide autocomplete suggestions
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { CitySuggestion } from '../types';
import { searchCities } from '../services/locationService';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: CitySuggestion) => void;
  placeholder?: string;
}

export default function CityAutocomplete({
  value,
  onChangeText,
  onSelect,
  placeholder = 'Search for a city',
}: Props) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);
    const id = ++requestId.current;

    const timer = setTimeout(async () => {
      try {
        const results = await searchCities(trimmed);
        if (requestId.current !== id) return;
        setSuggestions(results);
        setSearchError(results.length ? null : 'No cities found — try a nearby major city');
      } catch {
        if (requestId.current !== id) return;
        setSuggestions([]);
        setSearchError('Could not search cities. Check your internet connection.');
      } finally {
        if (requestId.current === id) setSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [value]);

  function handleSelect(suggestion: CitySuggestion) {
    Keyboard.dismiss();
    onChangeText(suggestion.displayName);
    setSuggestions([]);
    onSelect(suggestion);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          autoFocus
        />
        {searching && <ActivityIndicator size="small" color={Colors.accent} />}
      </View>

      {suggestions.length > 0 && (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
        >
          {suggestions.map(item => (
            <TouchableOpacity
              key={`${item.latitude},${item.longitude},${item.displayName}`}
              style={styles.item}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color={Colors.accent} />
              <View style={styles.itemText}>
                <Text style={styles.itemCity} numberOfLines={1}>{item.cityName}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>{item.displayName}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!searching && searchError && value.trim().length >= 2 && (
        <Text style={styles.empty}>{searchError}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { marginBottom: 14, zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input:    { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.textDark },
  list:     {
    maxHeight: 220,
    marginTop: 6,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  item:     {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  itemText: { flex: 1 },
  itemCity: { fontSize: 14, fontWeight: '500', color: Colors.textDark },
  itemSub:  { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  empty:    { fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});
