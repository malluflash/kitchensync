import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';
import { colors, spacing, radius } from '../theme';

const PlanFeature = ({ text, included, gold }) => (
  <View style={styles.featureRow}>
    <Ionicons
      name={included ? 'checkmark-circle' : 'close-circle-outline'}
      size={18}
      color={included ? (gold ? colors.gold : colors.primary) : colors.textDim}
    />
    <Text style={[styles.featureText, !included && styles.featureTextMuted]}>{text}</Text>
  </View>
);

const CompareRow = ({ label, free, pro }) => (
  <View style={styles.compareRow}>
    <Text style={styles.compareLabel}>{label}</Text>
    <Text style={styles.compareVal}>{free}</Text>
    <View style={styles.compareProCell}>
      {typeof pro === 'boolean' ? (
        <Ionicons name={pro ? 'checkmark' : 'close'} size={16} color={pro ? colors.primary : colors.red} />
      ) : (
        <Text style={[styles.compareVal, { color: colors.primary }]}>{pro}</Text>
      )}
    </View>
  </View>
);

export default function PremiumUpgradeScreen({ navigation }) {
  const { isPremium, upgradeToPremium, cancelPremium } = usePremium();

  const handleUpgrade = async () => {
    await upgradeToPremium();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🌿🍎🧀🥛🥦</Text>
          <Text style={styles.heroTitle}>Cut waste, save money.</Text>
          <Text style={styles.heroSub}>Join 50,000+ eco-friendly households</Text>
        </View>

        <Text style={styles.sectionTitle}>Choose your plan</Text>

        {/* Free Plan */}
        <View style={[styles.planCard, isPremium && styles.planCardDim]}>
          <View style={styles.planHeader}>
            <Text style={styles.planTier}>FREE</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>$0</Text>
              <Text style={styles.planPricePer}>/month</Text>
            </View>
          </View>
          <PlanFeature text="Up to 20 items trackable" included />
          <PlanFeature text="Basic expiry alerts" included />
          <PlanFeature text="Contains advertisements" included={false} />
          <View style={isPremium ? styles.planBtnInactive : styles.planBtnCurrent}>
            <Text style={isPremium ? styles.planBtnInactiveText : styles.planBtnCurrentText}>
              {isPremium ? 'Downgrade' : 'Current Plan'}
            </Text>
          </View>
          {isPremium && (
            <TouchableOpacity onPress={cancelPremium} style={styles.downgradeTouch}>
              <Text style={styles.downgradeText}>Tap to downgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pro Plan */}
        <View style={[styles.planCard, styles.planCardPro]}>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={[styles.planTier, { color: colors.primary }]}>PRO</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>$4.99</Text>
              <Text style={styles.planPricePer}>/month</Text>
            </View>
          </View>
          <PlanFeature text="Ad-free experience" included gold />
          <PlanFeature text="Advanced Food Waste Analytics" included gold />
          <PlanFeature text="Smart Expiry Suggestions" included gold />
          <PlanFeature text="Unlimited Cloud Sync" included gold />
          <PlanFeature text="Family Sharing (5 accounts)" included gold />

          {isPremium ? (
            <View style={styles.currentProBtn}>
              <Ionicons name="star" size={16} color={colors.gold} />
              <Text style={styles.currentProText}>Active Plan</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
              <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Comparison Table */}
        <Text style={styles.sectionTitle}>Plan Comparison</Text>
        <View style={styles.compareTable}>
          <View style={styles.compareHeaderRow}>
            <View style={{ flex: 2 }} />
            <Text style={styles.compareHeaderCell}>Free</Text>
            <Text style={[styles.compareHeaderCell, { color: colors.primary }]}>Pro</Text>
          </View>
          <CompareRow label="Inventory limit" free="20" pro="∞" />
          <CompareRow label="Barcode scanner" free="✗" pro={true} />
          <CompareRow label="Smart insights" free="✗" pro={true} />
          <CompareRow label="Custom notifications" free="✓" pro="✓" />
          <CompareRow label="Cloud backup" free="✗" pro={true} />
        </View>

        {/* Ad for free users */}
        {!isPremium && (
          <View style={styles.adBox}>
            <View style={styles.adHeader}>
              <Text style={styles.adLabel}>SPONSORED AD</Text>
              <Ionicons name="close-circle" size={16} color={colors.textDim} />
            </View>
            <View style={styles.adContent}>
              <Text style={styles.adPlaceholder}>Example Ad Content</Text>
            </View>
            <Text style={styles.adFooter}>Upgrade to Pro to remove ads and support independent developers.</Text>
          </View>
        )}

        <Text style={styles.legalText}>
          Subscription auto-renews unless cancelled 24h before.{'\n'}
          Terms of Service • Privacy Policy
        </Text>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  closeBtn: { padding: 4 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  scroll: { paddingHorizontal: spacing.lg },

  heroBanner: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  heroEmoji: { fontSize: 36, marginBottom: spacing.md },
  heroTitle: { color: colors.white, fontWeight: '800', fontSize: 26, textAlign: 'center', marginBottom: 8 },
  heroSub: { color: colors.primary, fontSize: 13 },

  sectionTitle: { color: colors.white, fontWeight: '700', fontSize: 18, marginBottom: spacing.md, marginTop: 4 },

  planCard: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planCardPro: { borderColor: colors.primary, position: 'relative', paddingTop: spacing.xl + 12 },
  planCardDim: { opacity: 0.6 },
  recommendedBadge: {
    position: 'absolute', top: -1, right: spacing.lg,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  recommendedText: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  planHeader: { marginBottom: spacing.md },
  planTier: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  planPrice: { color: colors.white, fontWeight: '800', fontSize: 34 },
  planPricePer: { color: colors.textMuted, fontSize: 14, paddingBottom: 4 },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  featureText: { color: colors.white, fontSize: 14 },
  featureTextMuted: { color: colors.textMuted },

  planBtnCurrent: {
    marginTop: spacing.md, padding: 14, borderRadius: radius.md,
    backgroundColor: colors.primaryDim, alignItems: 'center',
  },
  planBtnCurrentText: { color: colors.primary, fontWeight: '700' },
  planBtnInactive: {
    marginTop: spacing.md, padding: 14, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
  },
  planBtnInactiveText: { color: colors.textMuted, fontWeight: '600' },
  downgradeTouch: { alignItems: 'center', marginTop: 8 },
  downgradeText: { color: colors.red, fontSize: 12 },

  upgradeBtn: {
    marginTop: spacing.md, padding: 16, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  upgradeBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  currentProBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.md, padding: 14, borderRadius: radius.md,
    backgroundColor: '#1A2A00',
  },
  currentProText: { color: colors.gold, fontWeight: '700', fontSize: 15 },

  compareTable: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', marginBottom: spacing.lg,
  },
  compareHeaderRow: {
    flexDirection: 'row', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  compareHeaderCell: { flex: 1, color: colors.textMuted, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  compareLabel: { flex: 2, color: colors.white, fontSize: 13 },
  compareVal: { flex: 1, color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  compareProCell: { flex: 1, alignItems: 'center' },

  adBox: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, marginBottom: spacing.lg,
  },
  adHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  adLabel: { color: colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  adContent: {
    height: 80, backgroundColor: colors.background, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  adPlaceholder: { color: colors.textMuted, fontSize: 14 },
  adFooter: { color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16 },

  legalText: { color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: spacing.md },
});
