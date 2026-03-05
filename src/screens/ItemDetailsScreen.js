import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFridge } from '../context/FridgeContext';
import { COMPARTMENTS } from '../data/compartments';
import { getFreshnessInfo, getDaysUntilExpiry, formatDateDisplay } from '../utils/freshness';
import { colors, spacing, radius } from '../theme';

const ITEM_EMOJIS = {
  'Dairy': '🥛', 'Bakery': '🍞', 'Vegetables': '🥬', 'Fruits': '🍎',
  'Meat': '🍗', 'Seafood': '🐟', 'Beverages': '🧃', 'Leftovers': '🍱',
  'Condiments': '🫙', 'Other': '📦',
};

// Modal for "Use Some" partial consumption
function UseSomeModal({ visible, item, onConfirm, onCancel }) {
  const max = item?.quantity || 1;
  const [amount, setAmount] = useState(1);

  // Reset to 1 whenever modal opens for a new item
  React.useEffect(() => { if (visible) setAmount(1); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <Text style={ms.title}>How many did you use?</Text>
          <Text style={ms.sub}>
            {item?.name} · {max} {item?.unit || 'units'} remaining
          </Text>

          {/* Amount Stepper */}
          <View style={ms.stepperRow}>
            <TouchableOpacity
              style={[ms.stepBtn, amount <= 1 && ms.stepBtnDisabled]}
              onPress={() => setAmount(a => Math.max(1, a - 1))}
            >
              <Text style={ms.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={ms.amountBox}>
              <Text style={ms.amountValue}>{amount}</Text>
              <Text style={ms.amountUnit}>{item?.unit || 'units'}</Text>
            </View>
            <TouchableOpacity
              style={[ms.stepBtn, amount >= max && ms.stepBtnDisabled]}
              onPress={() => setAmount(a => Math.min(max, a + 1))}
            >
              <Text style={ms.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Remaining preview */}
          <View style={ms.remainingRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
            <Text style={ms.remainingText}>
              {max - amount === 0
                ? 'All used — item will be marked consumed'
                : `${max - amount} ${item?.unit || 'units'} will remain`}
            </Text>
          </View>

          <View style={ms.btns}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onCancel}>
              <Text style={ms.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ms.confirmBtn} onPress={() => onConfirm(amount)}>
              <Text style={ms.confirmText}>
                {max - amount === 0 ? 'Mark Consumed' : 'Confirm Use'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  title: { color: colors.white, fontWeight: '700', fontSize: 20, textAlign: 'center', marginBottom: 6 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 28 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 },
  stepBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { color: colors.primary, fontSize: 28, fontWeight: '700', lineHeight: 32 },
  amountBox: { alignItems: 'center', minWidth: 80 },
  amountValue: { color: colors.white, fontWeight: '800', fontSize: 48 },
  amountUnit: { color: colors.textMuted, fontSize: 13, marginTop: -4 },
  remainingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.background, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 24,
  },
  remainingText: { color: colors.textMuted, fontSize: 13 },
  btns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 16, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 16, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { color: colors.white, fontWeight: '700' },
});

export default function ItemDetailsScreen({ navigation, route }) {
  const { itemId } = route.params;
  const { items, markConsumed, moveToTrash, updateItem, usePartial } = useFridge();
  const [showUseSome, setShowUseSome] = useState(false);

  const item = useMemo(() => items.find(i => i.id === itemId), [items, itemId]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.white, textAlign: 'center', marginTop: 40 }}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const freshness = getFreshnessInfo(item.addedOn, item.expiryDate);
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const compartment = COMPARTMENTS.find(c => c.id === item.compartment);
  const emoji = item.emoji || ITEM_EMOJIS[item.category] || '📦';
  const qty = item.quantity || 1;
  // originalQuantity is set when adding; fall back to current qty for legacy items
  const maxQty = item.originalQuantity ?? qty;

  const handleConsumed = () => {
    if (qty > 1) {
      // Show partial modal so user can choose how many to use
      setShowUseSome(true);
    } else {
      Alert.alert(
        'Mark as Consumed',
        `Remove "${item.name}" from your fridge?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: async () => { await markConsumed(item.id); navigation.goBack(); } },
        ]
      );
    }
  };

  const handleUseSomeConfirm = async (amount) => {
    setShowUseSome(false);
    await usePartial(item.id, amount);
    if (qty - amount <= 0) {
      navigation.goBack();
    }
  };

  const handleTrash = () => {
    Alert.alert(
      'Move to Trash',
      `Move "${item.name}" to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', style: 'destructive', onPress: async () => { await moveToTrash(item.id); navigation.goBack(); } },
      ]
    );
  };

  const handleToggleNotify = (value) => {
    updateItem(item.id, { notifyDaysBefore: value ? 1 : 0 });
  };

  const handleQtyChange = (delta) => {
    const newQty = Math.min(maxQty, Math.max(0, qty + delta));
    if (newQty === qty) return; // already at ceiling or floor, no-op
    if (newQty === 0) {
      Alert.alert(
        'All Used Up!',
        `Mark "${item.name}" as consumed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Consumed', onPress: async () => { await markConsumed(item.id); navigation.goBack(); } },
        ]
      );
    } else {
      updateItem(item.id, { quantity: newQty });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero emoji */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
        </View>

        {/* Item Title */}
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>{item.category}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{compartment?.name || item.compartment}</Text>
          <View style={[styles.freshBadge, { borderColor: freshness.color }]}>
            <Text style={[styles.freshBadgeText, { color: freshness.color }]}>
              {freshness.percent >= 60 ? 'Fresh' : daysLeft <= 0 ? 'Expired' : 'Low'}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>EXPIRES IN</Text>
            <Text style={styles.statValue}>
              {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft} Day${daysLeft > 1 ? 's' : ''}`}
            </Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-down" size={12} color={colors.orange} />
              <Text style={styles.statTrendText}>-1 day</Text>
            </View>
          </View>

          {/* Quantity stat card with interactive stepper */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>QUANTITY</Text>
            <Text style={styles.statValue}>{qty} <Text style={styles.statUnit}>{item.unit || 'units'}</Text></Text>
            <View style={styles.qtyStepperRow}>
              <TouchableOpacity
                style={styles.qtyMiniBtn}
                onPress={() => handleQtyChange(-1)}
              >
                <Text style={styles.qtyMiniBtnText}>−</Text>
              </TouchableOpacity>
              <View style={[styles.statTrend, { flex: 1, justifyContent: 'center' }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                <Text style={[styles.statTrendText, { color: colors.primary }]}>In Stock</Text>
              </View>
              <TouchableOpacity
                style={[styles.qtyMiniBtn, qty >= maxQty && { opacity: 0.3 }]}
                onPress={() => handleQtyChange(1)}
                disabled={qty >= maxQty}
              >
                <Text style={styles.qtyMiniBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Freshness Bar */}
        <View style={styles.freshnessSection}>
          <View style={styles.freshnessLabelRow}>
            <Text style={[styles.freshnessStatusText, { color: freshness.color }]}>{freshness.label}</Text>
            <Text style={[styles.freshnessPct, { color: freshness.color }]}>{freshness.percent}%</Text>
          </View>
          <View style={styles.freshnessBarBg}>
            <View style={[styles.freshnessBarFill, { width: `${freshness.percent}%`, backgroundColor: freshness.barColor }]} />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>ADDED ON</Text>
            <Text style={styles.dateValue}>{formatDateDisplay(item.addedOn)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>EXPIRES</Text>
            <Text style={[styles.dateValue, { color: freshness.color }]}>{formatDateDisplay(item.expiryDate)}</Text>
          </View>
        </View>

        {/* Notification Settings */}
        <Text style={styles.sectionHeader}>NOTIFICATION SETTINGS</Text>
        <View style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={styles.notifLeft}>
              <Ionicons name="notifications" size={20} color={colors.primary} style={styles.notifIcon} />
              <Text style={styles.notifText}>Remind me 1 day before</Text>
            </View>
            <Switch
              value={item.notifyDaysBefore > 0}
              onValueChange={handleToggleNotify}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.notifDivider} />
          <View style={styles.notifRow}>
            <View style={styles.notifLeft}>
              <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.notifIcon} />
              <View>
                <Text style={styles.notifText}>Custom reminder time</Text>
                <Text style={styles.notifSub}>Scheduled for {item.customReminderTime || '09:00 AM'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>

        {/* Notes */}
        {item.notes ? (
          <>
            <Text style={styles.sectionHeader}>NOTES</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {/* Use Some — only if qty > 1 */}
          {qty > 1 && (
            <TouchableOpacity style={styles.useSomeBtn} onPress={() => setShowUseSome(true)} activeOpacity={0.85}>
              <Ionicons name="remove-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.useSomeText}>Use Some</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.consumeBtn} onPress={handleConsumed} activeOpacity={0.85}>
          <Ionicons name="restaurant" size={20} color={colors.white} />
          <Text style={styles.consumeText}>
            {qty > 1 ? 'Use All / Mark Consumed' : 'Mark as Consumed'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trashBtn} onPress={handleTrash} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={20} color={colors.red} />
          <Text style={styles.trashText}>Move to Trash</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Use Some Modal */}
      <UseSomeModal
        visible={showUseSome}
        item={item}
        onConfirm={handleUseSomeConfirm}
        onCancel={() => setShowUseSome(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  moreBtn: { padding: 4 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 30 },

  heroContainer: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    height: 200, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  heroEmoji: { fontSize: 96 },

  itemName: { color: colors.white, fontWeight: '700', fontSize: 28, marginBottom: 8 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  metaText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  metaDot: { color: colors.textMuted, fontSize: 13 },
  freshBadge: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3, marginLeft: 'auto',
  },
  freshBadgeText: { fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md,
  },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  statValue: { color: colors.white, fontWeight: '700', fontSize: 22, marginBottom: 4 },
  statUnit: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTrendText: { color: colors.orange, fontSize: 11 },

  // Quantity stepper on stat card
  qtyStepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  qtyMiniBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  qtyMiniBtnText: { color: colors.primary, fontSize: 16, fontWeight: '700', lineHeight: 20 },

  freshnessSection: { marginBottom: spacing.lg },
  freshnessLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  freshnessStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  freshnessPct: { fontSize: 11, fontWeight: '600' },
  freshnessBarBg: { height: 6, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  freshnessBarFill: { height: '100%', borderRadius: 3 },

  datesRow: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dateItem: { flex: 1, alignItems: 'center' },
  dateLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  dateValue: { color: colors.white, fontWeight: '600', fontSize: 14 },
  dateDivider: { width: 1, backgroundColor: colors.separator },

  sectionHeader: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },

  notifCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
  },
  notifLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  notifIcon: { marginRight: spacing.sm },
  notifText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  notifSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  notifDivider: { height: 1, backgroundColor: colors.separator },

  notesCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  notesText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  actionsRow: { marginBottom: spacing.sm },
  useSomeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.xl,
    padding: 16, gap: spacing.sm, marginBottom: spacing.sm,
  },
  useSomeText: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  consumeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: 18, gap: spacing.sm, marginBottom: spacing.sm,
  },
  consumeText: { color: colors.white, fontWeight: '700', fontSize: 17 },
  trashBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.redDim, borderRadius: radius.xl,
    padding: 16, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.red + '40',
  },
  trashText: { color: colors.red, fontWeight: '700', fontSize: 17 },
});
