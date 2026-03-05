import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Alert, Platform,
  Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFridge } from '../context/FridgeContext';
import { usePremium, FREE_ITEM_LIMIT } from '../context/PremiumContext';
import { ScrollView as HScroll } from 'react-native';
import { COMMON_ITEMS } from '../data/commonItems';
import { COMPARTMENTS } from '../data/compartments';
import { addDaysToToday, todayISO, formatDateDisplay } from '../utils/freshness';
import { colors, spacing, radius } from '../theme';

function DatePickerModal({ visible, value, onConfirm, onCancel, title }) {
  const today = new Date();
  const [year, setYear] = useState(value ? value.split('-')[0] : String(today.getFullYear()));
  const [month, setMonth] = useState(value ? value.split('-')[1] : String(today.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(value ? value.split('-')[2] : String(today.getDate()).padStart(2, '0'));

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={dpStyles.overlay}>
        <View style={dpStyles.sheet}>
          <Text style={dpStyles.title}>{title}</Text>
          <View style={dpStyles.row}>
            <View style={dpStyles.col}>
              <Text style={dpStyles.label}>Month</Text>
              <ScrollView style={dpStyles.scroll} nestedScrollEnabled>
                {months.map((m, i) => {
                  const mm = String(i + 1).padStart(2, '0');
                  return (
                    <TouchableOpacity key={m} style={[dpStyles.opt, month === mm && dpStyles.optActive]} onPress={() => setMonth(mm)}>
                      <Text style={[dpStyles.optText, month === mm && dpStyles.optTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={dpStyles.col}>
              <Text style={dpStyles.label}>Day</Text>
              <ScrollView style={dpStyles.scroll} nestedScrollEnabled>
                {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                  <TouchableOpacity key={d} style={[dpStyles.opt, day === d && dpStyles.optActive]} onPress={() => setDay(d)}>
                    <Text style={[dpStyles.optText, day === d && dpStyles.optTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={dpStyles.col}>
              <Text style={dpStyles.label}>Year</Text>
              <ScrollView style={dpStyles.scroll} nestedScrollEnabled>
                {Array.from({ length: 5 }, (_, i) => String(today.getFullYear() + i)).map(y => (
                  <TouchableOpacity key={y} style={[dpStyles.opt, year === y && dpStyles.optActive]} onPress={() => setYear(y)}>
                    <Text style={[dpStyles.optText, year === y && dpStyles.optTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={dpStyles.btns}>
            <TouchableOpacity style={dpStyles.cancelBtn} onPress={onCancel}>
              <Text style={dpStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dpStyles.confirmBtn} onPress={() => onConfirm(`${year}-${month}-${day}`)}>
              <Text style={dpStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title: { color: colors.white, fontWeight: '700', fontSize: 18, marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  col: { flex: 1 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  scroll: { height: 160 },
  opt: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  optActive: { backgroundColor: colors.primaryDim },
  optText: { color: colors.textMuted, fontSize: 15 },
  optTextActive: { color: colors.primary, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText: { color: colors.white, fontWeight: '700' },
});

export default function AddItemScreen({ navigation, route }) {
  const { activeItems, addItem, frequentItems } = useFridge();
  const { isPremium } = usePremium();
  const defaultCompartment = route.params?.defaultCompartment || 'main';

  const [itemName, setItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [compartment, setCompartment] = useState(defaultCompartment);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('units');
  const [addedOn, setAddedOn] = useState(todayISO());
  const [expiryDate, setExpiryDate] = useState(addDaysToToday(7));
  const [notes, setNotes] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedDays, setSuggestedDays] = useState(7);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showCompartmentDropdown, setShowCompartmentDropdown] = useState(false);
  const [showAddedPicker, setShowAddedPicker] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const filteredItems = useMemo(() =>
    itemName.trim()
      ? COMMON_ITEMS.filter(i => i.name.toLowerCase().includes(itemName.toLowerCase()))
      : COMMON_ITEMS,
    [itemName]
  );

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemName(item.name);
    setUnit(item.unit || 'units');
    setSuggestedDays(item.suggestedDays);
    setShowSuggestion(true);
    setShowItemDropdown(false);
    setExpiryDate(addDaysToToday(item.suggestedDays));
  };

  const applySuggestion = () => {
    setExpiryDate(addDaysToToday(suggestedDays));
  };

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Required', 'Please enter an item name.');
      return;
    }

    // Free tier limit check
    if (!isPremium && activeItems.length >= FREE_ITEM_LIMIT) {
      Alert.alert(
        'Free Plan Limit Reached',
        `You've reached the ${FREE_ITEM_LIMIT} item limit. Upgrade to Pro for unlimited items!`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') },
        ]
      );
      return;
    }

    const item = {
      name: itemName.trim(),
      category: selectedItem?.category || 'Other',
      emoji: selectedItem?.emoji || '📦',
      compartment,
      quantity,
      unit,
      addedOn,
      expiryDate,
      notes: notes.trim(),
    };

    await addItem(item);
    navigation.goBack();
  };

  const selectedCompartment = COMPARTMENTS.find(c => c.id === compartment);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Item</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Frequently Added / Buy Again */}
        {frequentItems.length > 0 && !showItemDropdown && (
          <>
            <Text style={styles.label}>🔁 Buy Again</Text>
            <HScroll horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg }}>
                {frequentItems.map(fi => (
                  <TouchableOpacity
                    key={fi.name}
                    style={styles.frequentChip}
                    onPress={() => handleSelectItem(fi)}
                  >
                    <Text style={styles.frequentChipEmoji}>{fi.emoji}</Text>
                    <Text style={styles.frequentChipText}>{fi.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </HScroll>
          </>
        )}

        {/* Item Name */}
        <Text style={styles.label}>Item Name</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => { setShowItemDropdown(!showItemDropdown); setShowCompartmentDropdown(false); }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.dropdownIcon} />
          <TextInput
            style={styles.dropdownInput}
            placeholder="Search or type item name..."
            placeholderTextColor={colors.textMuted}
            value={itemName}
            onChangeText={t => { setItemName(t); setShowItemDropdown(true); setShowSuggestion(false); setSelectedItem(null); }}
            onFocus={() => setShowItemDropdown(true)}
          />
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {showItemDropdown && (
          <View style={styles.dropdown}>
            {filteredItems.slice(0, 8).map(item => (
              <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => handleSelectItem(item)}>
                <Text style={styles.dropdownEmoji}>{item.emoji}</Text>
                <View style={styles.dropdownItemText}>
                  <Text style={styles.dropdownItemName}>{item.name}</Text>
                  <Text style={styles.dropdownItemSub}>{item.category} · {item.suggestedDays} days</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Smart Suggestion */}
        {showSuggestion && (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionLeft}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="sparkles" size={20} color={colors.white} />
              </View>
              <View>
                <Text style={styles.suggestionTitle}>Smart Suggestion</Text>
                <Text style={styles.suggestionSub}>Suggesting {suggestedDays} days for {selectedItem?.name}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={applySuggestion}>
              <Text style={styles.applyText}>Apply  ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Storage Location */}
        <Text style={styles.label}>Storage Location</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => { setShowCompartmentDropdown(!showCompartmentDropdown); setShowItemDropdown(false); }}
        >
          <Ionicons name="filing" size={16} color={colors.textMuted} style={styles.dropdownIcon} />
          <Text style={styles.dropdownValue}>{selectedCompartment?.name || 'Select location'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {showCompartmentDropdown && (
          <View style={styles.dropdown}>
            {COMPARTMENTS.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.dropdownItem}
                onPress={() => { setCompartment(c.id); setShowCompartmentDropdown(false); }}
              >
                <Ionicons name={c.icon} size={18} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={styles.dropdownItemName}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quantity */}
        <View style={styles.quantityCard}>
          <View style={styles.quantityLeft}>
            <View style={styles.qtyIconBox}>
              <Ionicons name="file-tray-full" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <Text style={styles.qtyUnit}>Units or Packs</Text>
            </View>
          </View>
          <View style={styles.qtyStepper}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Added On</Text>
            <TouchableOpacity style={styles.datePicker} onPress={() => setShowAddedPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.calIcon} />
              <Text style={styles.dateText}>{formatDateDisplay(addedOn)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.label}>Expiry Date</Text>
            <TouchableOpacity style={[styles.datePicker, styles.expiryDatePicker]} onPress={() => setShowExpiryPicker(true)}>
              <Ionicons name="calendar-clear-outline" size={18} color={colors.orange} style={styles.calIcon} />
              <Text style={styles.dateText}>{formatDateDisplay(expiryDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="E.g. Purchased from Organic Market..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={22} color={colors.white} style={styles.confirmIcon} />
          <Text style={styles.confirmText}>Confirm & Add Item</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Pickers */}
      <DatePickerModal
        visible={showAddedPicker}
        value={addedOn}
        title="Select Added On Date"
        onConfirm={(d) => { setAddedOn(d); setShowAddedPicker(false); }}
        onCancel={() => setShowAddedPicker(false)}
      />
      <DatePickerModal
        visible={showExpiryPicker}
        value={expiryDate}
        title="Select Expiry Date"
        onConfirm={(d) => { setExpiryDate(d); setShowExpiryPicker(false); }}
        onCancel={() => setShowExpiryPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  closeBtn: { padding: 4 },
  headerTitle: { color: colors.white, fontWeight: '700', fontSize: 18 },
  saveBtn: { padding: 4 },
  saveText: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  form: { flex: 1, paddingHorizontal: spacing.lg },

  label: { color: colors.white, fontWeight: '600', fontSize: 14, marginTop: spacing.lg, marginBottom: spacing.sm },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 14,
  },
  dropdownIcon: { marginRight: spacing.sm },
  dropdownInput: { flex: 1, color: colors.white, fontSize: 15 },
  dropdownValue: { flex: 1, color: colors.white, fontSize: 15 },
  dropdown: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  dropdownEmoji: { fontSize: 20, marginRight: spacing.sm },
  dropdownItemText: {},
  dropdownItemName: { color: colors.white, fontWeight: '600', fontSize: 14 },
  dropdownItemSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  suggestionCard: {
    backgroundColor: colors.primaryDim, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + '40',
    padding: spacing.md, marginTop: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  suggestionIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  suggestionTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
  suggestionSub: { color: colors.primary, fontSize: 12, marginTop: 2 },
  applyBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  applyText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  quantityCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm,
  },
  quantityLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyIconBox: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  qtyLabel: { color: colors.white, fontWeight: '600', fontSize: 15 },
  qtyUnit: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: colors.primary, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  qtyValue: { color: colors.white, fontWeight: '700', fontSize: 18, minWidth: 30, textAlign: 'center' },

  datesRow: { flexDirection: 'row', gap: spacing.sm },
  dateCol: { flex: 1 },
  datePicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md,
  },
  expiryDatePicker: { borderColor: colors.orange + '60' },
  calIcon: { marginRight: spacing.sm },
  dateText: { color: colors.white, fontSize: 13, fontWeight: '600' },

  notesInput: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, color: colors.white, fontSize: 14,
    minHeight: 80,
  },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: 18, marginTop: spacing.xl, gap: spacing.sm,
  },
  confirmIcon: { marginRight: 4 },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 17 },

  frequentChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.card, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary + '50',
    paddingVertical: 8, paddingHorizontal: spacing.md,
  },
  frequentChipEmoji: { fontSize: 18 },
  frequentChipText: { color: colors.white, fontWeight: '600', fontSize: 13 },
});
