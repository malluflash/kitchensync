import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { mockAnalyticsData } from '../data/mockAnalytics';
import GaugeChart from '../components/analytics/GaugeChart';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const { sustainabilityScore, savedVsWasted, topWastedCategories, environmentalImpact } = mockAnalyticsData;

  const renderGaugeCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardHeader}>SUSTAINABILITY SCORE</Text>
      <View style={styles.gaugeContainer}>
        <GaugeChart score={sustainabilityScore.score} />
      </View>
      <Text style={styles.reductionText}>
        You've reduced food waste by <Text style={styles.highlightText}>{sustainabilityScore.wasteReductionPercentage}%</Text> compared to last month. Keep it up!
      </Text>
    </View>
  );

  const renderSavedVsWasted = () => {
    // Find max value to scale chart proportionally
    const maxVal = Math.max(...savedVsWasted.chartData.map(d => Math.max(d.saved, d.wasted)));
    const chartHeight = 150;

    return (
      <View style={{ marginBottom: spacing.lg }}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Food Saved vs Wasted</Text>
          <View style={styles.totalSavedBox}>
            <Text style={styles.totalSavedAmount}>{savedVsWasted.totalSavedKg}kg</Text>
            <Text style={styles.totalSavedLabel}>TOTAL SAVED</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>Last 30 days</Text>

        <View style={styles.chartCard}>
          <View style={[styles.barChartContainer, { height: chartHeight }]}>
            {savedVsWasted.chartData.map((data, index) => {
              const savedHeight = (data.saved / maxVal) * chartHeight;
              const wastedHeight = (data.wasted / maxVal) * chartHeight;

              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barsArea}>
                    <View style={[styles.bar, styles.savedBar, { height: savedHeight }]} />
                    <View style={[styles.bar, styles.wastedBar, { height: wastedHeight }]} />
                  </View>
                  <Text style={styles.barLabel}>{data.week}</Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.green || '#4cd964' }]} />
              <Text style={styles.legendText}>Saved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
              <Text style={styles.legendText}>Wasted</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTopCategories = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.sectionTitle}>Top Wasted Categories</Text>
      
      {topWastedCategories.map((cat, index) => (
        <View key={index} style={styles.categoryCard}>
          <View style={[styles.catIconBox, { backgroundColor: cat.color + '20' }]}>
            <Ionicons name={cat.icon} size={20} color={cat.color} />
          </View>
          
          <View style={styles.catContent}>
            <View style={styles.catHeader}>
              <Text style={styles.catName}>{cat.name}</Text>
              <View>
                <Text style={styles.catPercent}>{cat.percentage}%</Text>
                <Text style={styles.catAmount}>{cat.amountKg}kg wasted</Text>
              </View>
            </View>
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderEnvironmentalImpact = () => (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.sectionTitle}>Environmental Impact</Text>
      
      <View style={styles.impactRow}>
        <View style={styles.impactCard}>
          <View style={[styles.impactIconBox, { backgroundColor: '#4cd964' + '20' }]}>
            <Ionicons name="water" size={24} color="#4cd964" />
          </View>
          <Text style={styles.impactNumber}>{environmentalImpact.waterSavedGallons.toLocaleString()}</Text>
          <Text style={styles.impactLabel}>GALLONS OF WATER SAVED</Text>
        </View>

        <View style={styles.impactCard}>
          <View style={[styles.impactIconBox, { backgroundColor: '#4cd964' + '20' }]}>
            <Ionicons name="leaf" size={24} color="#4cd964" />
          </View>
          <Text style={styles.impactNumber}>{environmentalImpact.co2OffsetKg}kg</Text>
          <Text style={styles.impactLabel}>CO2 OFFSET</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="share-social" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderGaugeCard()}
        {renderSavedVsWasted()}
        {renderTopCategories()}
        {renderEnvironmentalImpact()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerIcon: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  
  // Sustainability Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  gaugeContainer: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  reductionText: {
    color: colors.textDim,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  highlightText: {
    color: colors.green || '#4cd964',
    fontWeight: '700',
  },

  // Saved vs Wasted Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: colors.textDim,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  totalSavedBox: {
    alignItems: 'flex-end',
  },
  totalSavedAmount: {
    color: colors.green || '#4cd964',
    fontSize: 22,
    fontWeight: '800',
  },
  totalSavedLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: spacing.lg,
  },
  barGroup: {
    alignItems: 'center',
    width: 40,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  savedBar: {
    backgroundColor: colors.green || '#4cd964',
  },
  wastedBar: {
    backgroundColor: '#ff9800',
  },
  barLabel: {
    color: colors.textDim,
    fontSize: 10,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textDim,
    fontSize: 12,
  },

  // Top Wasted Categories
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  catContent: {
    flex: 1,
    justifyContent: 'center',
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  catName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  catPercent: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  catAmount: {
    color: colors.textDim,
    fontSize: 10,
    textAlign: 'right',
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Environmental Impact
  impactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#1C2A00', // matches pro dark green from mock/settings
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4cd964' + '40',
  },
  impactIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  impactNumber: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  impactLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
