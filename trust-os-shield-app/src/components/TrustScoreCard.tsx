import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface TrustScoreCardProps {
  overallScore: number;
  scoreColor: string;
  scoreLabel: string;
  loading?: boolean;
}

export const TrustScoreCard: React.FC<TrustScoreCardProps> = ({
  overallScore,
  scoreColor,
  scoreLabel,
  loading = false,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scoreAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      // Animate progress ring
      Animated.timing(animatedValue, {
        toValue: overallScore / 1000,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Animate score number
      Animated.timing(scoreAnimation, {
        toValue: overallScore,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [overallScore, loading]);

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const scoreDisplay = scoreAnimation.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, 1000],
  });

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Score Circle */}
        <View style={styles.scoreCircleContainer}>
          {/* Background Ring */}
          <View style={styles.ringContainer}>
            <View style={[styles.ringBackground]} />
            {/* Progress Ring - Using View with width animation as ring fallback */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressRing,
                  {
                    borderColor: scoreColor,
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          </View>

          {/* Score Display */}
          <View style={styles.scoreDisplayContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>...</Text>
              </View>
            ) : (
              <>
                <Animated.Text style={[styles.scoreNumber, { color: scoreColor }]}>
                  {overallScore}
                </Animated.Text>
                <Text style={styles.scoreMax}>/1000</Text>
                <View style={[styles.scoreLabelBadge, { backgroundColor: `${scoreColor}20` }]}>
                  <Text style={[styles.scoreLabelText, { color: scoreColor }]}>
                    {scoreLabel}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>99.2%</Text>
            <Text style={styles.statLabel}>Protection</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Alerts Blocked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Breaches Found</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBackground: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#E5E7EB',
  },
  progressContainer: {
    position: 'absolute',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  scoreDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: -4,
  },
  scoreLabelBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
});

export default TrustScoreCard;
