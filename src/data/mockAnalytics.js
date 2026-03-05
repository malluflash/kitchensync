export const mockAnalyticsData = {
  sustainabilityScore: {
    score: 78,
    label: "Excellent",
    wasteReductionPercentage: 12,
  },
  savedVsWasted: {
    totalSavedKg: 12.4,
    chartData: [
      { week: 'Wk 1', saved: 3.2, wasted: 1.5 },
      { week: 'Wk 2', saved: 2.8, wasted: 0.8 },
      { week: 'Wk 3', saved: 4.1, wasted: 1.2 },
      { week: 'Wk 4', saved: 2.3, wasted: 0.5 },
    ]
  },
  topWastedCategories: [
    { id: '1', name: 'Produce', percentage: 45, amountKg: 2.1, icon: 'nutrition-outline', color: '#ff9800' },
    { id: '2', name: 'Dairy & Eggs', percentage: 22, amountKg: 1.0, icon: 'water-outline', color: '#2196f3' },
    { id: '3', name: 'Bakery', percentage: 15, amountKg: 0.7, icon: 'restaurant-outline', color: '#9c27b0' },
  ],
  environmentalImpact: {
    waterSavedGallons: 1240,
    co2OffsetKg: 8.5,
  }
};
