import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme';

export default function GaugeChart({ score, size = 180, strokeWidth = 12 }) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // Let the gauge be a roughly 3/4 circle (e.g. 270 degrees)
  const angle = 270;
  // Calculate gap (360 - 270 = 90 degrees gap at the bottom)
  const dashoffset = circumference - (circumference * angle) / 360;
  
  // Calculate filled portion
  const fillPercentage = score / 100;
  const fillDashoffset = circumference - (circumference * angle * fillPercentage) / 360;

  // We want the gap at the bottom.
  // Standard start is 3 o'clock. To start at the bottom left for a 270 deg arc...
  // A 270 deg arc means 90 deg gap. Gap is from 135 to 225 deg at bottom.
  const rotation = 135;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.cardBorder}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          rotation={rotation}
          originX={center}
          originY={center}
        />
        {/* Foreground Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.green || '#4cd964'} 
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={fillDashoffset}
          rotation={rotation}
          originX={center}
          originY={center}
        />
        {/* Marker at top-center indicating maximum or just decorative */}
        <Path 
           d={`M ${center} ${strokeWidth - 6} L ${center} ${strokeWidth + 6}`}
           stroke={colors.green || '#4cd964'}
           strokeWidth={4}
           strokeLinecap="round"
        />
      </Svg>
      <View style={styles.centerTextContainer}>
        <Text style={styles.scoreText}>{score}</Text>
        <Text style={styles.labelText}>Excellent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '0deg' }], // handled in react-native-svg rotation prop
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
  },
  labelText: {
    fontSize: 14,
    color: colors.green || '#4cd964',
    fontWeight: '600',
    marginTop: -5,
  }
});
