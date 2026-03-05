import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  TouchableOpacity, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  const toggleStep = (index) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const completedCount = completedSteps.size;
  const progress = steps.length > 0 ? completedCount / steps.length : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Image */}
      <View style={styles.heroContainer}>
        {recipe.imageUrl || recipe.imageQuery ? (
          <Image
            source={{
              uri: recipe.imageUrl ||
                `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop`,
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderIcon}>🍳</Text>
          </View>
        )}
        {/* Gradient overlay */}
        <View style={styles.heroOverlay} />

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>

        {/* Badges on image */}
        <View style={styles.heroBadges}>
          {recipe.priority && (
            <View style={styles.priorityBadge}>
              <Ionicons name="flame" size={13} color={colors.background} />
              <Text style={styles.priorityText}>Use First</Text>
            </View>
          )}
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={13} color={colors.white} />
            <Text style={styles.timeText}>{recipe.time || '—'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title & Description */}
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        {/* Missing ingredients warning */}
        {recipe.missing && (
          <View style={styles.missingCard}>
            <View style={styles.missingHeader}>
              <Ionicons name="cart-outline" size={16} color="#FF8A00" />
              <Text style={styles.missingHeaderText}>YOU'LL ALSO NEED</Text>
            </View>
            <Text style={styles.missingItems}>{recipe.missing}</Text>
          </View>
        )}

        {/* Progress bar (only shown once user starts tapping steps) */}
        {completedCount > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {completedCount === steps.length
                ? '🎉 Done! Enjoy your meal!'
                : `Step ${completedCount} of ${steps.length}`}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧂 Ingredients</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.ingredientDot} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍🍳 Instructions</Text>
            {steps.map((step, i) => {
              const done = completedSteps.has(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.stepCard, done && styles.stepCardDone]}
                  onPress={() => toggleStep(i)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.stepNumber, done && styles.stepNumberDone]}>
                    {done
                      ? <Ionicons name="checkmark" size={14} color={colors.background} />
                      : <Text style={styles.stepNumberText}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={[styles.stepText, done && styles.stepTextDone]}>{step}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* No steps fallback */}
        {steps.length === 0 && ingredients.length === 0 && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>
              Tap "✨ Get AI Suggestions" again to load a recipe with full cooking steps.
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

  heroContainer: {
    width,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#1A2A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  heroPlaceholderIcon: { fontSize: 64 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'transparent',
    // Bottom-to-top gradient simulation via nested views
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadges: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryBright,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  priorityText: { color: colors.background, fontSize: 12, fontWeight: '700' },
  timeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  timeText: { color: colors.white, fontSize: 12, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },

  title: {
    color: colors.white, fontSize: 26, fontWeight: '800',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textMuted, fontSize: 14, lineHeight: 21,
    marginBottom: spacing.lg,
  },

  missingCard: {
    backgroundColor: '#2A1A00',
    borderRadius: radius.md,
    borderWidth: 1, borderColor: '#FF8A0040',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  missingHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  missingHeaderText: {
    color: '#FF8A00', fontSize: 11, fontWeight: '700', letterSpacing: 1,
  },
  missingItems: { color: colors.white, fontSize: 13, lineHeight: 20 },

  progressSection: { marginBottom: spacing.lg },
  progressLabel: {
    color: colors.primaryBright, fontSize: 13, fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6, backgroundColor: colors.cardBorder,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.primaryBright,
    borderRadius: radius.full,
  },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.white, fontSize: 17, fontWeight: '700',
    marginBottom: spacing.md,
  },

  ingredientRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: spacing.sm, gap: spacing.sm,
  },
  ingredientDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.primaryBright,
    marginTop: 6,
  },
  ingredientText: { color: colors.white, fontSize: 14, flex: 1, lineHeight: 21 },

  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md,
  },
  stepCardDone: {
    backgroundColor: '#0D2010',
    borderColor: colors.primary + '60',
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1E3A1E',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberDone: { backgroundColor: colors.primaryBright },
  stepNumberText: { color: colors.primaryBright, fontSize: 13, fontWeight: '700' },
  stepText: { color: colors.white, fontSize: 14, lineHeight: 21, flex: 1 },
  stepTextDone: { color: colors.textMuted, textDecorationLine: 'line-through' },

  noDataCard: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.xl, alignItems: 'center',
  },
  noDataText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
