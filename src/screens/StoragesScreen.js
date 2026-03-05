import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFridge } from '../context/FridgeContext';
import { usePremium } from '../context/PremiumContext';
import { colors, spacing, radius, typography } from '../theme';

const TABS = ['All Units', 'Kitchen', 'Storage Room', 'Office', 'Other'];

export default function StoragesScreen({ navigation }) {
  const { storages, items, activeStorageId, setActiveStorage } = useFridge();
  const { isPremium } = usePremium();
  const [activeTab, setActiveTab] = useState('All Units');

  const filteredStorages = useMemo(() => {
    if (activeTab === 'All Units') return storages;
    return storages.filter(
      s => (s.location || 'Other').toLowerCase() === activeTab.toLowerCase()
    );
  }, [storages, activeTab]);

  const handleAddStorage = () => {
    if (!isPremium && storages.length >= 1) {
      navigation.navigate('PremiumUpgrade');
      return;
    }
    Alert.alert('Add Storage', 'Functionality to add storage coming soon!');
    // Ideally open a modal to add a new storage
  };

  const renderStorageCard = ({ item }) => {
    const isActive = item.id === activeStorageId;
    const storageItems = items.filter(i => i.storageId === item.id && !i.consumed && !i.trashed);
    
    // For visual representation of multiple mockups, assign mock images or styles
    // Since we don't have images ready, use solid gradient-ish backgrounds 
    const isMain = item.id === 'default';

    return (
      <View style={styles.cardContainer}>
        {/* Mock background placeholder */}
        <View style={[styles.cardBg, isMain ? { backgroundColor: '#4a6a8a' } : { backgroundColor: '#e2e2e2' }]}>
            {/* If it's active we can show ACTIVE NOW badge on top right */}
            {isActive && (
                <View style={[styles.locationBadge, { position: 'absolute', top: 10, right: 10, backgroundColor: colors.gold }]}>
                    <Text style={[styles.locationBadgeText, { color: colors.background, fontWeight: '700' }]}>ACTIVE NOW</Text>
                </View>
            )}
            <View style={[styles.locationBadge, { position: 'absolute', bottom: 10, left: 10, backgroundColor: colors.overlay }]}>
               <Text style={styles.locationBadgeText}>{(item.location || 'OTHER').toUpperCase()}</Text>
            </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
             <Text style={styles.cardTitle}>{item.name}</Text>
             {/* Simple mock expiring text - could compute from real items */}
             <Text style={styles.expiringText}>
                 <Ionicons name="calendar-outline" size={12} /> 0 Expiring
             </Text>
          </View>
          <Text style={styles.cardSubtitle}>
             {item.description} • {storageItems.length} items
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity 
               style={[styles.actionBtn, isActive ? styles.actionBtnActive : {}]}
               onPress={() => isActive ? navigation.navigate('Home') : setActiveStorage(item.id)}
            >
               <Text style={[styles.actionBtnText, isActive ? { color: colors.background } : {}]}>
                  {isActive ? 'View Inventory' : 'Set as Active'}
               </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreBtn}>
               <Ionicons name="ellipsis-horizontal" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
           <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Manage Storages</Text>
            {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.premiumText}>PREMIUM PLAN</Text>
                </View>
            )}
        </View>

        <TouchableOpacity style={[styles.iconBtn, styles.addBtnBg]} onPress={handleAddStorage}>
           <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(tab => {
           const isActive = activeTab === tab;
           return (
             <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                {isActive && <View style={styles.tabUnderline} />}
             </TouchableOpacity>
           )
        })}
      </View>
      <View style={styles.tabDivider} />

      {/* List */}
      <FlatList
         data={filteredStorages}
         keyExtractor={item => item.id}
         renderItem={renderStorageCard}
         contentContainerStyle={styles.listContent}
         ListFooterComponent={
            <TouchableOpacity style={styles.addStorageDashed} onPress={handleAddStorage}>
               <View style={styles.addStorageIconWrap}>
                 <Ionicons name="add" size={24} color={colors.white} />
               </View>
               <Text style={styles.addStorageText}>Add New Storage Unit</Text>
            </TouchableOpacity>
         }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  iconBtn: { padding: spacing.xs, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtnBg: { backgroundColor: colors.gold, borderRadius: radius.full },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  premiumBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gold + '20', 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 
  },
  premiumText: { color: colors.gold, fontSize: 10, fontWeight: '700', marginLeft: 4, letterSpacing: 0.5 },

  tabsContainer: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md,
    marginTop: spacing.md
  },
  tab: { paddingBottom: spacing.xs, alignItems: 'center' },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.gold, fontWeight: '700' },
  tabUnderline: {
    height: 2, backgroundColor: colors.gold, borderRadius: 1,
    width: '100%', marginTop: 6,
  },
  tabDivider: { height: 1, backgroundColor: colors.separator, marginBottom: spacing.md },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  cardContainer: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderWidth: 1, 
      borderColor: colors.cardBorder,
      overflow: 'hidden'
  },
  cardBg: {
      height: 120,
      width: '100%',
      backgroundColor: colors.primaryDim,
      position: 'relative'
  },
  locationBadge: {
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
  },
  locationBadgeText: {
      fontSize: 10, fontWeight: 'bold', color: colors.white
  },
  cardContent: {
      padding: spacing.md
  },
  cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  cardTitle: {
      fontSize: 18, fontWeight: 'bold', color: colors.white
  },
  expiringText: {
      fontSize: 12, color: colors.red, fontWeight: '600'
  },
  cardSubtitle: {
      fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md
  },
  cardActions: {
      flexDirection: 'row', gap: spacing.sm
  },
  actionBtn: {
      flex: 1,
      backgroundColor: '#1E2A38', // Dark grey/blueish
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center'
  },
  actionBtnActive: {
      backgroundColor: colors.gold,
  },
  actionBtnText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 14
  },
  moreBtn: {
      backgroundColor: '#1E2A38',
      width: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center'
  },

  addStorageDashed: {
      borderWidth: 1,
      borderColor: colors.textMuted,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xl
  },
  addStorageIconWrap: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.textMuted,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm
  },
  addStorageText: {
      fontSize: 16, fontWeight: 'bold', color: colors.textMuted
  }
});
