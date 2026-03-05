import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Switch, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';
import { useFridge } from '../context/FridgeContext';
import { colors, spacing, radius } from '../theme';
import { useSettings } from '../context/SettingsContext';

function SettingRow({ icon, label, subtitle, onPress, rightElement, danger }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingIconBox, danger && styles.settingIconBoxDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.red : colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, danger && { color: colors.red }]}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement !== undefined ? rightElement : (
        onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textDim} /> : null
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { isPremium, upgradeToPremium, cancelPremium } = usePremium();
  const { items, activeItems } = useFridge();
  const { apiKey, saveApiKey, pexelsKey, savePexelsKey } = useSettings();

  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pexelsInput, setPexelsInput] = useState(pexelsKey || '');
  const [showPexels, setShowPexels] = useState(false);
  const [savingPexels, setSavingPexels] = useState(false);

  // Sync inputs when keys load from AsyncStorage
  useEffect(() => {
    if (apiKey) setKeyInput(apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (pexelsKey) setPexelsInput(pexelsKey);
  }, [pexelsKey]);

  const handleSavePexelsKey = async () => {
    setSavingPexels(true);
    try {
      await savePexelsKey(pexelsInput);
      Alert.alert('Saved', 'Pexels API key saved. Recipe images will now match your dishes!');
    } catch {
      Alert.alert('Error', 'Failed to save Pexels key. Please try again.');
    } finally {
      setSavingPexels(false);
    }
  };

  const maskedPexels = pexelsKey && pexelsKey.length > 4
    ? '••••••••••••' + pexelsKey.slice(-4)
    : pexelsKey;

  const handleSaveKey = async () => {
    setSaving(true);
    try {
      await saveApiKey(keyInput);
      Alert.alert('Saved', 'Your OpenRouter API key has been saved.');
    } catch {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Masked display: show last 4 chars if key is saved
  const maskedKey = apiKey && apiKey.length > 4
    ? '••••••••••••' + apiKey.slice(-4)
    : apiKey;

  const totalItems = items.length;
  const consumed = items.filter(i => i.consumed).length;
  const trashed = items.filter(i => i.trashed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.statNum}>{activeItems.length}</Text>
            <Text style={styles.statLabel}>In Fridge</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.statNum}>{consumed}</Text>
            <Text style={styles.statLabel}>Consumed</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Analytics')}>
            <Text style={styles.statNum}>{trashed}</Text>
            <Text style={styles.statLabel}>Trashed</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Card */}
        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={() => navigation.navigate('Analytics')}
        >
          <View style={[styles.settingIconBox, { backgroundColor: colors.green + '20' }]}>
            <Ionicons name="pie-chart" size={18} color={colors.green || '#4cd964'} />
          </View>
          <View style={styles.premiumText}>
            <Text style={styles.premiumTitle}>Your Analytics</Text>
            <Text style={styles.premiumSub}>View your food waste and impact</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Premium Status */}
        <TouchableOpacity
          style={isPremium ? styles.premiumCardActive : styles.premiumCard}
          onPress={() => navigation.navigate('PremiumUpgrade')}
        >
          <Ionicons name={isPremium ? 'star' : 'star-outline'} size={26} color={isPremium ? colors.gold : colors.primary} />
          <View style={styles.premiumText}>
            <Text style={styles.premiumTitle}>{isPremium ? 'KitchenSync Pro' : 'Upgrade to Pro'}</Text>
            <Text style={styles.premiumSub}>{isPremium ? 'Active subscription' : 'Unlock all features for $4.99/month'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* AI Recipes */}
        <Text style={styles.sectionHeader}>AI RECIPES</Text>
        <View style={styles.section}>
          <View style={styles.apiKeyRow}>
            <View style={[styles.settingIconBox, { backgroundColor: '#1A2A3A' }]}>
              <Ionicons name="sparkles" size={18} color="#6EB5FF" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>OpenRouter API Key</Text>
              {apiKey ? (
                <Text style={styles.settingSubtitle}>Saved: {maskedKey}</Text>
              ) : (
                <Text style={[styles.settingSubtitle, { color: '#FF8A00' }]}>Not set — required for AI recipes</Text>
              )}
            </View>
          </View>
          <View style={styles.apiInputRow}>
            <TextInput
              style={styles.apiInput}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-or-..."
              placeholderTextColor={colors.textDim}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeButton}>
              <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.saveKeyButton, saving && { opacity: 0.6 }]}
            onPress={handleSaveKey}
            disabled={saving}
          >
            <Text style={styles.saveKeyText}>{saving ? 'Saving…' : 'Save API Key'}</Text>
          </TouchableOpacity>
          <Text style={styles.apiHint}>
            Get a free key at{' '}
            <Text style={{ color: '#6EB5FF' }}>openrouter.ai</Text>
          </Text>

          <View style={styles.rowDivider} />

          {/* Pexels key */}
          <View style={styles.apiKeyRow}>
            <View style={[styles.settingIconBox, { backgroundColor: '#1A1A2E' }]}>
              <Ionicons name="images-outline" size={18} color="#C5A3E0" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Pexels API Key</Text>
              {pexelsKey ? (
                <Text style={styles.settingSubtitle}>Saved: {maskedPexels}</Text>
              ) : (
                <Text style={[styles.settingSubtitle, { color: colors.textDim }]}>Optional — for matched recipe photos</Text>
              )}
            </View>
          </View>
          <View style={styles.apiInputRow}>
            <TextInput
              style={styles.apiInput}
              value={pexelsInput}
              onChangeText={setPexelsInput}
              placeholder="px-..."
              placeholderTextColor={colors.textDim}
              secureTextEntry={!showPexels}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPexels(!showPexels)} style={styles.eyeButton}>
              <Ionicons name={showPexels ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.saveKeyButton, { backgroundColor: '#7C3AED' }, savingPexels && { opacity: 0.6 }]}
            onPress={handleSavePexelsKey}
            disabled={savingPexels}
          >
            <Text style={styles.saveKeyText}>{savingPexels ? 'Saving…' : 'Save Pexels Key'}</Text>
          </TouchableOpacity>
          <Text style={styles.apiHint}>
            Free key at{' '}
            <Text style={{ color: '#C5A3E0' }}>pexels.com/api</Text>
          </Text>
        </View>

        {/* Developer Toggle — for testing premium */}
        <Text style={styles.sectionHeader}>DEVELOPER OPTIONS</Text>
        <View style={styles.section}>
          <SettingRow
            icon="star"
            label="Premium Mode"
            subtitle={isPremium ? 'Currently active' : 'Toggle for testing'}
            rightElement={
              <Switch
                value={isPremium}
                onValueChange={(v) => v ? upgradeToPremium() : cancelPremium()}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <SettingRow
            icon="notifications-outline"
            label="Default reminder time"
            subtitle="09:00 AM"
            onPress={() => {}}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="time-outline"
            label="Notify before expiry"
            subtitle="1 day before"
            onPress={() => {}}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            subtitle="1.0.0"
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => {}}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        <Text style={styles.footerText}>KitchenSync © 2026</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 20 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  statsCard: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.white, fontWeight: '800', fontSize: 26 },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.separator },

  analyticsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.md,
  },

  premiumCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primaryDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primary + '40',
    padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.md,
  },
  premiumCardActive: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1C2A00', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.gold + '60',
    padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.md,
  },
  premiumText: { flex: 1 },
  premiumTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  premiumSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  sectionHeader: {
    color: colors.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  section: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
  },
  settingIconBox: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  settingIconBoxDanger: { backgroundColor: colors.redDim },
  settingText: { flex: 1 },
  settingLabel: { color: colors.white, fontWeight: '600', fontSize: 14 },
  settingSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: colors.separator, marginLeft: 60 },

  apiKeyRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
  },
  apiInputRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md,
    backgroundColor: '#0D1A0D',
    borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
  },
  apiInput: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    padding: spacing.md,
    fontFamily: 'monospace',
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  saveKeyButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveKeyText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  apiHint: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },

  footerText: { color: colors.textDim, textAlign: 'center', fontSize: 12, marginTop: spacing.xl },
});
