import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { useFridge } from '../context/FridgeContext';
import { useSettings } from '../context/SettingsContext';
import { getAIRecipes } from '../utils/openrouter';

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner'];
const DIETARY_FILTERS = ['Vegetarian', 'Vegan', 'Gluten-Free'];

// Curated keyword → Unsplash photo ID map (direct CDN, no redirects needed)
const FOOD_PHOTO_MAP = [
  { keys: ['omelette', 'omelet'],          id: 'photo-1484723091739-30a097e8f929' },
  { keys: ['scrambled', 'egg', 'eggs'],    id: 'photo-1525351484163-7529414344d8' },
  { keys: ['fried rice', 'rice'],          id: 'photo-1603133872878-684f208fb84b' },
  { keys: ['curry', 'masala'],             id: 'photo-1585937421612-70a008356fbe' },
  { keys: ['chicken', 'poultry'],          id: 'photo-1604908176997-125f25cc6f3d' },
  { keys: ['salad', 'greens'],             id: 'photo-1512621776951-a57141f2eefd' },
  { keys: ['soup', 'stew', 'broth'],       id: 'photo-1547592180-85f173990554' },
  { keys: ['bread', 'toast', 'sandwich'],  id: 'photo-1509440159596-0249088772ff' },
  { keys: ['pasta', 'noodle', 'spaghetti'],id: 'photo-1481070414801-51fd732d7184' },
  { keys: ['pizza'],                       id: 'photo-1565299624946-b28f40a0ae38' },
  { keys: ['stir fry', 'stir-fry'],        id: 'photo-1603073163308-9654c3fb70b5' },
  { keys: ['avocado'],                     id: 'photo-1541519227354-08fa5d50c820' },
  { keys: ['pancake', 'waffle'],           id: 'photo-1567620905732-2d1ec7ab7445' },
  { keys: ['bowl', 'grain', 'quinoa'],     id: 'photo-1546069901-ba9599a7e63c' },
  { keys: ['fish', 'salmon', 'seafood'],   id: 'photo-1544943910-4c1dc44aab44' },
  { keys: ['burger', 'patty'],             id: 'photo-1568901346375-23c9450c58cd' },
  { keys: ['taco', 'wrap', 'burrito'],     id: 'photo-1565557623262-b51c2513a641' },
  { keys: ['smoothie', 'juice', 'shake'],  id: 'photo-1505252585461-04db1eb84625' },
  { keys: ['vegetable', 'veggie', 'veg'],  id: 'photo-1540914124281-342587941389' },
  { keys: ['chilli', 'chili', 'spicy'],    id: 'photo-1601050690597-df0568f70950' },
];
const FALLBACK_PHOTO_ID = 'photo-1504674900247-0877df9cc836';

function getRecipeImageUrl(recipe) {
  const searchText = `${recipe.imageQuery || ''} ${recipe.title || ''}`.toLowerCase();
  const match = FOOD_PHOTO_MAP.find(({ keys }) => keys.some((k) => searchText.includes(k)));
  const photoId = match ? match.id : FALLBACK_PHOTO_ID;
  return `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop&auto=format`;
}

function getErrorMessage(code) {
  switch (code) {
    case 'NO_API_KEY':
      return 'Add your OpenRouter API key in Settings first.';
    case 'INVALID_KEY':
      return 'Invalid API key. Please check your key in Settings.';
    case 'RATE_LIMITED':
      return 'Too many requests. Try again in a moment.';
    case 'PARSE_ERROR':
      return 'AI returned an unexpected response. Tap ✨ Try Again.';
    case 'EMPTY_RESPONSE':
      return 'The AI returned no recipes this time. Tap ✨ Try Again — it usually works on the next attempt.';
    case 'NETWORK_ERROR':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Something went wrong. Check your connection and try again.';
  }
}

export default function RecipesScreen({ navigation }) {
  const [activeMeal, setActiveMeal] = useState('All');
  const [activeFilters, setActiveFilters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const { activeItems } = useFridge();
  const { apiKey, pexelsKey } = useSettings();

  const expiringCount = activeItems.filter((item) => {
    if (!item.expiryDate) return false;
    const diffTime = new Date(item.expiryDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }).length;

  const toggleDietary = (filter) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const fetchRecipes = async () => {
    if (!apiKey) {
      Alert.alert(
        'API Key Missing',
        'Please add your OpenRouter API key in Settings → AI RECIPES.',
        [{ text: 'Go to Settings', onPress: () => navigation.navigate('Main', { screen: 'Profile' }) }, { text: 'Cancel' }]
      );
      return;
    }

    console.log('[RecipesScreen] fetchRecipes called');
    console.log('[RecipesScreen] activeItems count:', activeItems.length);
    console.log('[RecipesScreen] apiKey set:', !!apiKey);

    setLoading(true);
    setError(null);

    try {
      const results = await getAIRecipes(apiKey, activeItems, {
        mealType: activeMeal,
        dietary: activeFilters,
        pexelsKey,
      });
      console.log('[RecipesScreen] Got', results.length, 'recipes');
      setRecipes(results);
      setHasFetched(true);
    } catch (e) {
      console.error('[RecipesScreen] Error caught:', e.message);
      // Show the full raw error for easier debugging
      const code = e.message?.split(':')[0] || 'UNKNOWN';
      const detail = e.message || 'Unknown error';
      setError(`${getErrorMessage(code)}

Debug: ${detail}`);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Discovery</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Meal Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mealFiltersContainer}
        >
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.mealPill, activeMeal === type && styles.mealPillActive]}
              onPress={() => setActiveMeal(type)}
            >
              <Text style={[styles.mealPillText, activeMeal === type && styles.mealPillTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dietary Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dietaryFiltersContainer}
        >
          {DIETARY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.dietaryPill, activeFilters.includes(filter) && styles.dietaryPillActive]}
              onPress={() => toggleDietary(filter)}
            >
              <Text style={[styles.dietaryPillText, activeFilters.includes(filter) && styles.dietaryPillTextActive]}>
                {filter}
              </Text>
              {activeFilters.includes(filter) && (
                <Ionicons name="checkmark" size={14} color={colors.background} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Use them before they go!</Text>
          {expiringCount > 0 && (
            <View style={styles.expiringBadge}>
              <Text style={styles.expiringText}>{expiringCount} expiring soon</Text>
            </View>
          )}
        </View>

        {/* AI Suggestions Button */}
        <TouchableOpacity
          style={[styles.aiButton, loading && styles.aiButtonLoading]}
          onPress={fetchRecipes}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons name="sparkles" size={18} color={colors.background} />
          )}
          <Text style={styles.aiButtonText}>
            {loading ? 'Getting suggestions…' : '✨ Get AI Suggestions'}
          </Text>
        </TouchableOpacity>

        {/* No key warning */}
        {!apiKey && (
          <TouchableOpacity
            style={styles.noKeyBanner}
            onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
          >
            <Ionicons name="warning-outline" size={16} color="#FF8A00" />
            <Text style={styles.noKeyText}>
              Add your OpenRouter API key in Settings to enable AI recipes.
            </Text>
          </TouchableOpacity>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recipe Cards */}
        {recipes.length > 0 && (
          <View style={styles.recipesContainer}>
            {recipes.map((recipe, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recipeCard}
                onPress={() => navigation.navigate('RecipeDetail', { recipe })}
                activeOpacity={0.88}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: recipe.imageUrl || getRecipeImageUrl(recipe) }}
                    style={styles.recipeImage}
                  />
                  {recipe.priority && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>High Priority</Text>
                    </View>
                  )}
                  <View style={styles.timeBadge}>
                    <Ionicons name="time" size={12} color={colors.white} />
                    <Text style={styles.timeText}>{recipe.time}</Text>
                  </View>
                </View>

                <View style={styles.recipeContent}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDescription}>{recipe.description}</Text>

                  {recipe.missing && (
                    <View style={styles.missingSection}>
                      <View style={styles.missingTexts}>
                        <Text style={styles.missingLabel}>MISSING</Text>
                        <Text style={styles.missingItems}>{recipe.missing}</Text>
                      </View>
                      <TouchableOpacity style={styles.addMissingButton}>
                        <Ionicons name="cart-outline" size={16} color={colors.primaryBright} style={styles.addMissingIcon} />
                        <Text style={styles.addMissingText}>Add to List</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.viewRecipeRow}>
                    <Text style={styles.viewRecipeText}>View full recipe & steps</Text>
                    <Ionicons name="chevron-forward" size={15} color={colors.primaryBright} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state — shown after fetch with no error and no recipes */}
        {hasFetched && !loading && !error && recipes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No recipes returned</Text>
            <Text style={styles.emptySubtitle}>The AI skipped this one. Tap below to try again — it usually works on the next attempt.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRecipes}>
              <Text style={styles.retryButtonText}>✨ Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Initial prompt — before any fetch */}
        {!hasFetched && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>AI-Powered Recipes</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Get AI Suggestions" and the AI will suggest recipes based on what's in your fridge right now.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: '#1A2A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealFiltersContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  mealPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#1E2B3E',
    borderRadius: radius.md,
  },
  mealPillActive: { backgroundColor: colors.primaryBright },
  mealPillText: { color: colors.white, fontSize: 14, fontWeight: '500' },
  mealPillTextActive: { color: colors.background, fontWeight: '600' },
  dietaryFiltersContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  dietaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A3A2A',
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  dietaryPillActive: {
    backgroundColor: colors.primaryBright,
    borderColor: colors.primaryBright,
  },
  dietaryPillText: { color: colors.white, fontSize: 13 },
  dietaryPillTextActive: { color: colors.background, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  expiringBadge: {
    backgroundColor: '#3E2A1A',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  expiringText: { color: '#FF8A00', fontSize: 11, fontWeight: '600' },

  aiButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryBright,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  aiButtonLoading: { opacity: 0.8 },
  aiButtonText: { color: colors.background, fontWeight: '700', fontSize: 15 },

  noKeyBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#3E2A00',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FF8A0040',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noKeyText: { color: '#FF8A00', fontSize: 12, flex: 1 },

  errorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#2A0D0D',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FF444440',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { color: '#FF4444', fontSize: 13, textAlign: 'center' },

  recipesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  recipeCard: {
    backgroundColor: '#1A2A3A',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageContainer: { height: 180, width: '100%', position: 'relative' },
  recipeImage: { width: '100%', height: '100%' },
  priorityBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primaryBright,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  priorityText: { color: colors.background, fontSize: 12, fontWeight: '700' },
  timeBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  timeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  recipeContent: { padding: spacing.lg },
  recipeTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: spacing.xs },
  recipeDescription: { color: '#8A9BAA', fontSize: 13, lineHeight: 18, marginBottom: spacing.lg },
  missingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missingTexts: { flex: 1 },
  missingLabel: {
    color: '#8A9BAA', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 2,
  },
  missingItems: { color: '#FF4444', fontSize: 13 },
  addMissingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  addMissingIcon: { marginRight: 4 },
  addMissingText: { color: colors.primaryBright, fontSize: 13, fontWeight: '600' },

  viewRecipeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    marginTop: spacing.md, gap: 2,
  },
  viewRecipeText: { color: colors.primaryBright, fontSize: 13, fontWeight: '600' },

  emptyState: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  emptySubtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryBright,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  retryButtonText: { color: colors.background, fontWeight: '700', fontSize: 14 },
});
