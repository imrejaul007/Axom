import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrustScoreCard } from '../components/TrustScoreCard';

const { width } = Dimensions.get('window');

interface DimensionScore {
  dimension: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ScoreHistory {
  date: string;
  overall: number;
}

export default function ScoreScreen() {
  const [overallScore, setOverallScore] = useState(720);
  const [dimensions, setDimensions] = useState<DimensionScore[]>([
    { dimension: 'Identity', score: 850, trend: 'up', change: 15 },
    { dimension: 'Financial', score: 780, trend: 'stable', change: 0 },
    { dimension: 'Behavioral', score: 720, trend: 'up', change: 25 },
    { dimension: 'Reputation', score: 650, trend: 'down', change: -10 },
    { dimension: 'Compliance', score: 890, trend: 'stable', change: 0 },
  ]);
  const [history, setHistory] = useState<ScoreHistory[]>([
    { date: 'Jan', overall: 680 },
    { date: 'Feb', overall: 695 },
    { date: 'Mar', overall: 710 },
    { date: 'Apr', overall: 700 },
    { date: 'May', overall: 720 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScore();
  }, []);

  const loadScore = async () => {
    setLoading(true);
    // Simulate API call - replace with actual API integration
    try {
      // const response = await api.get('/trust-score');
      // setOverallScore(response.data.overall);
      // setDimensions(response.data.dimensions);
      // setHistory(response.data.history);
    } catch (error) {
      console.error('Failed to load score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return '#10B981'; // Excellent - green
    if (score >= 600) return '#F59E0B'; // Good - amber
    if (score >= 400) return '#EF4444'; // Fair - red
    return '#991B1B'; // Poor - dark red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 600) return 'Good';
    if (score >= 400) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Ionicons name="trending-up" size={16} color="#10B981" />;
      case 'down':
        return <Ionicons name="trending-down" size={16} color="#EF4444" />;
      default:
        return <Ionicons name="remove" size={16} color="#6B7280" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '#10B981';
      case 'down':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const renderMiniChart = () => {
    const maxScore = Math.max(...history.map(h => h.overall));
    const minScore = Math.min(...history.map(h => h.overall));
    const range = maxScore - minScore || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {history.map((point, index) => {
            const height = ((point.overall - minScore) / range) * 80 + 20;
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: height,
                      backgroundColor: getScoreColor(point.overall),
                    },
                  ]}
                />
                <Text style={styles.chartLabel}>{point.date}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDimensionCard = (item: DimensionScore, index: number) => {
    const color = getScoreColor(item.score);

    return (
      <View key={index} style={styles.dimensionCard}>
        <View style={styles.dimensionHeader}>
          <Text style={styles.dimensionName}>{item.dimension}</Text>
          <View style={styles.trendContainer}>
            {getTrendIcon(item.trend)}
            {item.change !== 0 && (
              <Text style={[styles.changeText, { color: getTrendColor(item.trend) }]}>
                {item.change > 0 ? '+' : ''}{item.change}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.dimensionBarContainer}>
          <View style={styles.dimensionBarBackground}>
            <View
              style={[
                styles.dimensionBarFill,
                { width: `${item.score}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={[styles.dimensionScore, { color }]}>{item.score}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trust Score</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadScore}>
          <Ionicons name="refresh" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Main Score Card */}
      <TrustScoreCard
        overallScore={overallScore}
        scoreColor={getScoreColor(overallScore)}
        scoreLabel={getScoreLabel(overallScore)}
        loading={loading}
      />

      {/* Score History Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score History</Text>
        {renderMiniChart()}
      </View>

      {/* Dimension Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        {dimensions.map((item, index) => renderDimensionCard(item, index))}
      </View>

      {/* Score Factors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Factors</Text>
        <View style={styles.factorsContainer}>
          <View style={styles.factorItem}>
            <View style={[styles.factorIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.factorTextContainer}>
              <Text style={styles.factorTitle}>Identity Verified</Text>
              <Text style={styles.factorDesc}>KYC completed +15</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <View style={[styles.factorIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="document-text" size={20} color="#F59E0B" />
            </View>
            <View style={styles.factorTextContainer}>
              <Text style={styles.factorTitle}>Clean Record</Text>
              <Text style={styles.factorDesc}>No fraud flags +20</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <View style={[styles.factorIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <View style={styles.factorTextContainer}>
              <Text style={styles.factorTitle}>Unresolved Alerts</Text>
              <Text style={styles.factorDesc}>2 alerts pending -30</Text>
            </View>
          </View>

          <View style={styles.factorItem}>
            <View style={[styles.factorIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="time" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.factorTextContainer}>
              <Text style={styles.factorTitle}>Account Age</Text>
              <Text style={styles.factorDesc}>2.5 years active +25</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Protection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Status</Text>
        <View style={styles.protectionCard}>
          <View style={styles.protectionRow}>
            <View style={styles.protectionLeft}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.protectionText}>Scam Protection Active</Text>
            </View>
            <Text style={styles.protectionStatus}>Protected</Text>
          </View>
          <View style={styles.protectionDivider} />
          <View style={styles.protectionRow}>
            <View style={styles.protectionLeft}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.protectionText}>Breach Monitoring</Text>
            </View>
            <Text style={styles.protectionStatus}>Protected</Text>
          </View>
          <View style={styles.protectionDivider} />
          <View style={styles.protectionRow}>
            <View style={styles.protectionLeft}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <Text style={styles.protectionText}>Dark Web Monitoring</Text>
            </View>
            <Text style={styles.protectionStatusPending}>2 exposures</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: 24,
    borderRadius: 6,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dimensionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dimensionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dimensionBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dimensionBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dimensionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dimensionScore: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  factorsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  factorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factorTextContainer: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  factorDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  protectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  protectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  protectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protectionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  protectionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  protectionStatusPending: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  protectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  bottomPadding: {
    height: 100,
  },
});
