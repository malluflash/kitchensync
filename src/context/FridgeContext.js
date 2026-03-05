import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleExpiryNotification, cancelNotification } from '../utils/notifications';
import { todayISO } from '../utils/freshness';

const STORAGE_KEY = '@myfridge_items';

const FridgeContext = createContext(null);

export function FridgeProvider({ children }) {
  const [items, setItems] = useState([]);
  const [storages, setStorages] = useState([]);
  const [activeStorageId, setActiveStorageId] = useState(null);
  const [frequentItems, setFrequentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const jsonStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonStr) {
        const data = JSON.parse(jsonStr);
        setItems(data.items || []);
        setFrequentItems(data.frequentItems || []);
        
        let loadedStorages = data.storages || [];
        if (loadedStorages.length === 0) {
          loadedStorages = [{
            id: 'default',
            name: 'Main Kitchen Fridge',
            description: 'Default Storage',
            location: 'KITCHEN',
            icon: 'grid'
          }];
        }
        setStorages(loadedStorages);
        setActiveStorageId(data.activeStorageId || loadedStorages[0].id);
      } else {
        // Initialize default
        const defaultStorage = {
            id: 'default',
            name: 'Main Kitchen Fridge',
            description: 'Default Storage',
            location: 'KITCHEN',
            icon: 'grid'
        };
        setStorages([defaultStorage]);
        setActiveStorageId('default');
      }
    } catch (e) {
      console.warn('Failed to load items:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveState = async (newItems, newStorages, newActiveId, newFrequentItems) => {
    try {
      const data = {
        items: newItems,
        storages: newStorages,
        activeStorageId: newActiveId,
        frequentItems: newFrequentItems,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save items:', e);
    }
  };

  const trackItemUsage = useCallback(async (itemData) => {
    // Record item in frequent list (top items for Buy Again feature)
    const existing = frequentItems.findIndex(f => f.name === itemData.name);
    let newFrequent;
    if (existing >= 0) {
      newFrequent = frequentItems.map((f, i) =>
        i === existing ? { ...f, count: f.count + 1 } : f
      );
    } else {
      newFrequent = [
        ...frequentItems,
        {
          name: itemData.name,
          category: itemData.category || 'Other',
          emoji: itemData.emoji || '📦',
          unit: itemData.unit || 'units',
          suggestedDays: itemData.suggestedDays || 7,
          count: 1,
        },
      ];
    }
    // Keep sorted by frequency
    newFrequent.sort((a, b) => b.count - a.count);
    setFrequentItems(newFrequent);
    return newFrequent;
  }, [frequentItems]);

  const addItem = useCallback(async (itemData) => {
    const defaultStorageId = activeStorageId || (storages.length > 0 ? storages[0].id : 'default');
    
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      addedOn: todayISO(),
      notifyDaysBefore: 1,
      customReminderTime: '09:00',
      consumed: false,
      trashed: false,
      notificationId: null,
      storageId: defaultStorageId,
      originalQuantity: itemData.quantity || 1, // permanent ceiling for stock tracking
      ...itemData,
    };

    // Schedule notification
    const notificationId = await scheduleExpiryNotification(newItem);
    newItem.notificationId = notificationId;

    const updated = [...items, newItem];
    setItems(updated);

    // Track for Buy Again feature
    const newFrequent = await trackItemUsage(itemData);
    await saveState(updated, storages, activeStorageId, newFrequent);
    return newItem;
  }, [items, storages, activeStorageId, trackItemUsage]);

  const updateItem = useCallback(async (id, changes) => {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;

    const oldItem = items[idx];
    const updated = { ...oldItem, ...changes };

    // Reschedule notification if expiry/settings changed
    if (
      changes.expiryDate !== undefined ||
      changes.notifyDaysBefore !== undefined ||
      changes.customReminderTime !== undefined
    ) {
      if (oldItem.notificationId) await cancelNotification(oldItem.notificationId);
      const notificationId = await scheduleExpiryNotification(updated);
      updated.notificationId = notificationId;
    }

    const newItems = [...items];
    newItems[idx] = updated;
    setItems(newItems);
    await saveState(newItems, storages, activeStorageId, frequentItems);
  }, [items, storages, activeStorageId, frequentItems]);

  const markConsumed = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (item?.notificationId) await cancelNotification(item.notificationId);
    return updateItem(id, { consumed: true, notificationId: null });
  }, [items, updateItem]);

  const moveToTrash = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (item?.notificationId) await cancelNotification(item.notificationId);
    return updateItem(id, { trashed: true, notificationId: null });
  }, [items, updateItem]);

  // Partial consumption: reduce quantity, auto-consume if hits 0
  const usePartial = useCallback(async (id, amountUsed) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, (item.quantity || 1) - amountUsed);
    if (newQty === 0) {
      if (item?.notificationId) await cancelNotification(item.notificationId);
      return updateItem(id, { quantity: 0, consumed: true, notificationId: null });
    }
    return updateItem(id, { quantity: newQty });
  }, [items, updateItem]);

  const deleteItem = useCallback(async (id) => {
    const item = items.find(i => i.id === id);
    if (item?.notificationId) await cancelNotification(item.notificationId);
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    await saveState(newItems, storages, activeStorageId, frequentItems);
  }, [items, storages, activeStorageId, frequentItems]);

  const addStorage = useCallback(async (storageData) => {
    const newStorage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...storageData,
    };
    const updated = [...storages, newStorage];
    setStorages(updated);
    await saveState(items, updated, activeStorageId, frequentItems);
    return newStorage;
  }, [items, storages, activeStorageId, frequentItems]);

  const setActiveStorage = useCallback(async (id) => {
    setActiveStorageId(id);
    await saveState(items, storages, id, frequentItems);
  }, [items, storages, frequentItems]);

  const deleteStorage = useCallback(async (id) => {
     // do not allow deleting the last storage
     if (storages.length <= 1) return;
     
     const newStorages = storages.filter(s => s.id !== id);
     let newActiveId = activeStorageId;
     if (activeStorageId === id) {
       newActiveId = newStorages[0].id;
     }

     // Also remove items associated with this storage
     const itemsToRemove = items.filter(i => i.storageId === id);
     for (const it of itemsToRemove) {
        if (it.notificationId) await cancelNotification(it.notificationId);
     }
     const newItems = items.filter(i => i.storageId !== id);

     setItems(newItems);
     setStorages(newStorages);
     setActiveStorageId(newActiveId);
     await saveState(newItems, newStorages, newActiveId, frequentItems);
  }, [items, storages, activeStorageId, frequentItems]);

  const restoreItem = useCallback(async (id) => {
    return updateItem(id, { consumed: false, trashed: false });
  }, [updateItem]);

  const topFrequentItems = frequentItems.slice(0, 5);

  const activeItems = items.filter(i => !i.consumed && !i.trashed && (i.storageId === activeStorageId || (!i.storageId && activeStorageId === 'default')));

  return (
    <FridgeContext.Provider value={{
      items,
      activeItems,
      loading,
      addItem,
      updateItem,
      markConsumed,
      moveToTrash,
      usePartial,
      deleteItem,
      restoreItem,
      storages,
      activeStorageId,
      addStorage,
      setActiveStorage,
      deleteStorage,
      frequentItems: topFrequentItems,
    }}>
      {children}
    </FridgeContext.Provider>
  );
}

export function useFridge() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error('useFridge must be used within FridgeProvider');
  return ctx;
}
