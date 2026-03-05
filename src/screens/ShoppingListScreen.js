import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { useFridge } from '../context/FridgeContext';
import { COMMON_ITEMS } from '../data/commonItems';
import { addDaysToToday } from '../utils/freshness';

const INITIAL_LIST = [
  { id: '1', name: 'Granny Smith Apples', qty: '5 units', category: 'PRODUCE', checked: false },
  { id: '2', name: 'Baby Spinach', qty: '200g', category: 'PRODUCE', checked: false },
  { id: '3', name: 'Organic Carrots', qty: '1 bunch', category: 'PRODUCE', checked: false },
  { id: '4', name: 'Whole Milk', qty: '2L', category: 'DAIRY', checked: false },
  { id: '5', name: 'Greek Yogurt', qty: '500g', category: 'DAIRY', checked: true },
  { id: '6', name: 'Chicken Breast', qty: '800g', category: 'MEAT', checked: false },
];

export default function ShoppingListScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Manual List');
  const [items, setItems] = useState(INITIAL_LIST);
  const { addItem } = useFridge();

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addSelectedToFridge = async () => {
    const selectedItems = items.filter(item => item.checked);
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please check items to add to your fridge.');
      return;
    }
    
    for (const shoppingItem of selectedItems) {
      // Try to find a matching item in COMMON_ITEMS for smart defaults
      const match = COMMON_ITEMS.find(
        ci => ci.name.toLowerCase() === shoppingItem.name.toLowerCase()
      );

      // Parse numeric quantity from string like "5 units" or "2L"
      const parsedQty = parseFloat(shoppingItem.qty) || 1;
      const parsedUnit = shoppingItem.qty.replace(/^[\d.]+\s*/, '') || (match?.unit ?? 'units');

      await addItem({
        name: shoppingItem.name,
        category: match?.category ?? shoppingItem.category ?? 'Other',
        emoji: match?.emoji ?? '📦',
        unit: parsedUnit,
        quantity: parsedQty,
        expiryDate: addDaysToToday(match?.suggestedDays ?? 7),
        suggestedDays: match?.suggestedDays,
      });
    }
    
    // Remove selected items from shopping list
    setItems(items.filter(item => !item.checked));
    Alert.alert('✅ Added to Fridge', `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} added to your inventory!`);
  };

  const categories = [...new Set(items.map(item => item.category))];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping List</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Manual List' && styles.activeTab]}
          onPress={() => setActiveTab('Manual List')}
        >
          <Text style={[styles.tabText, activeTab === 'Manual List' && styles.activeTabText]}>
            Manual List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Auto-Generated' && styles.activeTab]}
          onPress={() => setActiveTab('Auto-Generated')}
        >
          <Text style={[styles.tabText, activeTab === 'Auto-Generated' && styles.activeTabText]}>
            Auto-Generated
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {categories.map(category => {
          const categoryItems = items.filter(i => i.category === category);
          if (categoryItems.length === 0) return null;
          
          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.itemCountBadge}>
                  <Text style={styles.itemCountText}>
                    {categoryItems.length} {categoryItems.length === 1 ? 'ITEM' : 'ITEMS'}
                  </Text>
                </View>
              </View>

              {categoryItems.map(item => (
                <View key={item.id} style={styles.listItem}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => toggleItem(item.id)}
                  >
                    {item.checked ? (
                      <Ionicons name="checkmark-circle" size={28} color={colors.primaryBright} />
                    ) : (
                      <View style={styles.emptyCheckbox} />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemQty, item.checked && styles.itemQtyChecked]}>
                      Qty: {item.qty}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="pencil" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
        {/* Bottom padding to ensure content isn't hidden behind the sticky buttons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.addManualButton}>
          <Ionicons name="add" size={20} color={colors.primaryBright} />
          <Text style={styles.addManualText}>Add Item Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addToFridgeButton} onPress={addSelectedToFridge}>
          <MaterialCommunityIcons name="fridge-outline" size={20} color={colors.background} />
          <Text style={styles.addToFridgeText}>Add Selected to Fridge Inventory</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primaryBright,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primaryBright,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryTitle: {
    color: colors.primaryBright,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  itemCountBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  itemCountText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  emptyCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.textDim,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemNameChecked: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  itemQty: {
    color: colors.textMuted,
    fontSize: 13,
  },
  itemQtyChecked: {
    textDecorationLine: 'line-through',
  },
  editButton: {
    padding: spacing.sm,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  addManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  addManualText: {
    color: colors.primaryBright,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  addToFridgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBright,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  addToFridgeText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
