import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, StatusBar, Alert, Image, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFridge } from '../context/FridgeContext';
import { usePremium } from '../context/PremiumContext';
import { COMPARTMENTS } from '../data/compartments';
import { getFreshnessInfo, getDaysUntilExpiry } from '../utils/freshness';
import { colors, spacing, radius } from '../theme';

const ITEM_EMOJIS = {
  'Dairy': '🥛', 'Bakery': '🍞', 'Vegetables': '🥬', 'Fruits': '🍎',
  'Meat': '🍗', 'Seafood': '🐟', 'Beverages': '🧃', 'Leftovers': '🍱',
  'Condiments': '🫙', 'Other': '📦',
};

const SWIPE_THRESHOLD = 72;

function SwipeableItemCard({ item, onPress, onDecrement, onSwipeConsume, onSwipeTrash }) {
  const freshness = getFreshnessInfo(item.addedOn, item.expiryDate);
  const quantityDisplay = `${item.quantity} ${item.unit || 'units'}`;
  const translateX = useRef(new Animated.Value(0)).current;
  const [actionTriggered, setActionTriggered] = useState(null); // 'consume' | 'trash' | null
  const isSwiping = useRef(false);

  const panResponder = useRef(PanResponder.create({
    // Claim the gesture on first touch so FlatList doesn't steal it
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    // Activate only when clearly horizontal
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onMoveShouldSetPanResponderCapture: (_, gs) =>
      Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
    onPanResponderGrant: () => {
      isSwiping.current = true;
    },
    onPanResponderMove: (_, gs) => {
      translateX.setValue(gs.dx);
      if (gs.dx > SWIPE_THRESHOLD) setActionTriggered('consume');
      else if (gs.dx < -SWIPE_THRESHOLD) setActionTriggered('trash');
      else setActionTriggered(null);
    },
    onPanResponderRelease: (_, gs) => {
      isSwiping.current = false;
      if (gs.dx > SWIPE_THRESHOLD) {
        // Snap right and trigger consume
        Animated.timing(translateX, { toValue: 400, duration: 220, useNativeDriver: true }).start(() => {
          setActionTriggered(null);
          translateX.setValue(0);
          onSwipeConsume();
        });
      } else if (gs.dx < -SWIPE_THRESHOLD) {
        // Snap left and trigger trash
        Animated.timing(translateX, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
          setActionTriggered(null);
          translateX.setValue(0);
          onSwipeTrash();
        });
      } else {
        // Snap back
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        setActionTriggered(null);
      }
    },
    onPanResponderTerminate: () => {
      isSwiping.current = false;
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      setActionTriggered(null);
    },
  })).current;

  return (
    <View style={styles.swipeWrapper}>
      {/* Background actions */}
      <View style={styles.swipeBgRow}>
        <View style={[styles.swipeBg, styles.swipeBgConsume, actionTriggered === 'consume' && styles.swipeBgActive]}>
          <Ionicons name="restaurant" size={22} color={colors.white} />
          <Text style={styles.swipeBgText}>Used</Text>
        </View>
        <View style={[styles.swipeBg, styles.swipeBgTrash, actionTriggered === 'trash' && styles.swipeBgActive]}>
          <Text style={styles.swipeBgText}>Trash</Text>
          <Ionicons name="trash-outline" size={22} color={colors.white} />
        </View>
      </View>

      {/* Foreground card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.75} delayPressIn={100}>
          {/* Emoji thumbnail */}
          <View style={styles.itemThumb}>
            <Text style={styles.itemEmoji}>{item.emoji || ITEM_EMOJIS[item.category] || '📦'}</Text>
          </View>

          <View style={styles.itemInfo}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>{quantityDisplay}</Text>
            </View>
            <Text style={[styles.itemFreshnessLabel, { color: freshness.color }]}>
              {freshness.label}
            </Text>
            <View style={styles.freshnessRow}>
              <View style={styles.freshnessBarBg}>
                <View style={[styles.freshnessBarFill, {
                  width: `${freshness.percent}%`,
                  backgroundColor: freshness.barColor,
                }]} />
              </View>
              <Text style={[styles.freshnessPct, { color: freshness.color }]}>
                {freshness.percent}% Fresh
              </Text>
            </View>
          </View>

          {/* Quick Decrement Button */}
          <TouchableOpacity
            style={styles.decrementBtn}
            onPress={(e) => { e.stopPropagation(); onDecrement(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="remove-circle" size={30} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function InventoryScreen({ navigation }) {
  const { activeItems, activeStorageId, storages, usePartial, markConsumed, moveToTrash } = useFridge();
  const { isPremium } = usePremium();
  const [search, setSearch] = useState('');
  const [activeCompartment, setActiveCompartment] = useState('main');

  const activeStorage = useMemo(() =>
     storages.find(s => s.id === activeStorageId) || { name: 'My Fridge' },
  [storages, activeStorageId]);

  const expiringSoon = useMemo(() =>
    activeItems.filter(i => {
      const d = getDaysUntilExpiry(i.expiryDate);
      return d >= 0 && d <= 2;
    }), [activeItems]
  );

  const expiringSoonCompartments = useMemo(() => {
    const comps = new Set(expiringSoon.map(i => {
      const c = COMPARTMENTS.find(c => c.id === i.compartment);
      return c ? c.name : i.compartment;
    }));
    return [...comps].join(' and ');
  }, [expiringSoon]);

  const filteredItems = useMemo(() => {
    return activeItems.filter(item => {
      const matchCompartment = item.compartment === activeCompartment;
      const matchSearch = search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase());
      return matchCompartment && matchSearch;
    });
  }, [activeItems, activeCompartment, search]);

  const handleAddItem = () => {
    navigation.navigate('AddItem', { defaultCompartment: activeCompartment });
  };

  const handleDecrement = (item) => {
    const qty = item.quantity || 1;
    if (qty <= 1) {
      Alert.alert(
        'All Used Up!',
        `Mark "${item.name}" as consumed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Consumed', onPress: () => markConsumed(item.id) },
        ]
      );
    } else {
      usePartial(item.id, 1);
    }
  };

  const handleSwipeConsume = (item) => {
    Alert.alert(
      'Mark as Consumed',
      `Mark "${item.name}" as fully used?`,
      [
        { text: 'Undo', style: 'cancel' },
        { text: 'Confirm', onPress: () => markConsumed(item.id) },
      ]
    );
  };

  const handleSwipeTrash = (item) => {
    Alert.alert(
      'Move to Trash',
      `Move "${item.name}" to trash?`,
      [
        { text: 'Undo', style: 'cancel' },
        { text: 'Move', style: 'destructive', onPress: () => moveToTrash(item.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>{activeStorage.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('PremiumUpgrade')}
        >
          <Ionicons
            name={isPremium ? 'star' : 'person-circle'}
            size={32}
            color={isPremium ? colors.gold : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items in inventory"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Expiring Soon Banner */}
      {expiringSoon.length > 0 && (
        <View style={styles.expiringBanner}>
          <View style={styles.expiringLeft}>
            <Ionicons name="warning" size={18} color={colors.orange} />
            <View style={styles.expiringText}>
              <Text style={styles.expiringTitle}>{expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''} expiring soon</Text>
              {expiringSoonCompartments ? (
                <Text style={styles.expiringSubtitle}>Check {expiringSoonCompartments}.</Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => {}}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions Row */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Shopping')}>
          <View style={[styles.qaIconWrapper, { backgroundColor: colors.orange + '20' }]}>
            <Ionicons name="cart" size={24} color={colors.orange} />
          </View>
          <Text style={styles.quickActionText}>Smart{'\n'}Shopping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Recipes')}>
          <View style={[styles.qaIconWrapper, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="restaurant" size={24} color={colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Recipe{'\n'}Suggestions</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <Ionicons name="swap-horizontal-outline" size={13} color={colors.textMuted} />
        <Text style={styles.swipeHintText}>Swipe right to consume · Swipe left to trash · Tap − to use 1</Text>
      </View>

      {/* Compartment Tabs */}
      <View style={styles.tabsContainer}>
        {COMPARTMENTS.map(comp => (
          <TouchableOpacity
            key={comp.id}
            style={styles.tab}
            onPress={() => setActiveCompartment(comp.id)}
          >
            <Text style={[styles.tabText, activeCompartment === comp.id && styles.tabTextActive]}>
              {comp.name}
            </Text>
            {activeCompartment === comp.id && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabDivider} />

      {/* Item List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SwipeableItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
            onDecrement={() => handleDecrement(item)}
            onSwipeConsume={() => handleSwipeConsume(item)}
            onSwipeTrash={() => handleSwipeTrash(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        directionalLockEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧊</Text>
            <Text style={styles.emptyText}>No items in this compartment</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first item</Text>
          </View>
        }
      />

      {/* Ads Banner for free users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.adBanner}
          onPress={() => navigation.navigate('PremiumUpgrade')}
        >
          <Text style={styles.adText}>✨ Go Premium — Remove Ads & Unlock All Features</Text>
        </TouchableOpacity>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddItem} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 32, height: 32, borderRadius: radius.sm, marginRight: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  profileBtn: { padding: spacing.xs },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.full,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.white, fontSize: 15 },

  expiringBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.orangeDim, borderRadius: radius.md,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.orange + '40',
  },
  expiringLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  expiringText: { flex: 1 },
  expiringTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
  expiringSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  viewAllBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  viewAllText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  quickActionsContainer: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, 
    marginBottom: spacing.sm,
  },
  quickActionBtn: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, 
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
  },
  qaIconWrapper: {
    width: 44, height: 44, borderRadius: 22, 
    alignItems: 'center', justifyContent: 'center'
  },
  quickActionText: {
    color: colors.white, fontWeight: '600', fontSize: 13, flex: 1
  },

  swipeHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  swipeHintText: { color: colors.textMuted, fontSize: 11 },

  tabsContainer: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm,
  },
  tab: { paddingBottom: spacing.xs, paddingHorizontal: spacing.xs, alignItems: 'center' },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabUnderline: {
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
    width: '100%', marginTop: 4,
  },
  tabDivider: { height: 1, backgroundColor: colors.separator, marginTop: 4, marginBottom: 8 },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  // Swipe wrapper
  swipeWrapper: { marginBottom: spacing.sm, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  swipeBgRow: { position: 'absolute', inset: 0, flexDirection: 'row' },
  swipeBg: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6, opacity: 0.7,
  },
  swipeBgConsume: { backgroundColor: colors.primary },
  swipeBgTrash: { backgroundColor: colors.red },
  swipeBgActive: { opacity: 1 },
  swipeBgText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  itemThumb: {
    width: 62, height: 62, borderRadius: radius.sm,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { color: colors.white, fontWeight: '700', fontSize: 16, flex: 1 },
  itemQuantity: { color: colors.textSecondary, fontSize: 13, marginLeft: 8 },
  itemFreshnessLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 3, marginBottom: 5 },
  freshnessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  freshnessBarBg: {
    flex: 1, height: 5, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden',
  },
  freshnessBarFill: { height: '100%', borderRadius: 3 },
  freshnessPct: { fontSize: 11, fontWeight: '600', width: 70, textAlign: 'right' },

  decrementBtn: { paddingLeft: spacing.sm },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { color: colors.white, fontSize: 17, fontWeight: '600', marginBottom: spacing.xs },
  emptySubtext: { color: colors.textMuted, fontSize: 14 },

  adBanner: {
    backgroundColor: colors.primaryDim, paddingVertical: 10,
    paddingHorizontal: spacing.lg, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  adText: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  fab: {
    position: 'absolute', right: spacing.xl, bottom: 90,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8,
  },
});
