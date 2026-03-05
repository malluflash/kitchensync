import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@myfridge_settings';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [apiKey, setApiKey] = useState('');
  const [pexelsKey, setPexelsKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json) {
        const data = JSON.parse(json);
        setApiKey(data.apiKey || '');
        setPexelsKey(data.pexelsKey || '');
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (key) => {
    try {
      const trimmed = key.trim();
      const existing = await AsyncStorage.getItem(SETTINGS_KEY);
      const data = existing ? JSON.parse(existing) : {};
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...data, apiKey: trimmed }));
      setApiKey(trimmed);
    } catch (e) {
      console.warn('Failed to save API key:', e);
      throw e;
    }
  };

  const savePexelsKey = async (key) => {
    try {
      const trimmed = key.trim();
      const existing = await AsyncStorage.getItem(SETTINGS_KEY);
      const data = existing ? JSON.parse(existing) : {};
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...data, pexelsKey: trimmed }));
      setPexelsKey(trimmed);
    } catch (e) {
      console.warn('Failed to save Pexels key:', e);
      throw e;
    }
  };

  return (
    <SettingsContext.Provider value={{ apiKey, saveApiKey, pexelsKey, savePexelsKey, settingsLoading: loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
