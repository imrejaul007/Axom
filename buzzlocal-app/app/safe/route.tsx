import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

interface RouteWaypoint {
  lat: number;
  lng: number;
  name: string;
  note?: string;
}

interface SafeStop {
  name: string;
  distance: string;
  icon: string;
}

interface Route {
  safetyScore: number;
  estimatedTime: string;
  distance: string;
  waypoints: RouteWaypoint[];
  safeStops: SafeStop[];
  tips: string[];
}

export default function SafeRouteScreen() {
  const router = useRouter();
  const [fromLocation, setFromLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [toLocation, setToLocation] = useState('');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setFromLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    }
  };

  const findRoute = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Missing Info', 'Please enter destination');
      return;
    }
    setLoading(true);
    // Simulate route finding
    setTimeout(() => {
      const routeData: Route = {
        safetyScore: 85,
        estimatedTime: '15 mins',
        distance: '3.2 km',
        waypoints: [
          { lat: fromLocation.lat, lng: fromLocation.lng, name: 'Start' },
          { lat: 12.9352, lng: 77.6245, name: 'Main Road (Well-lit)' },
          { lat: 12.9380, lng: 77.6270, name: 'Police Station' },
          { lat: 12.9400, lng: 77.6300, name: 'Destination' },
        ],
        safeStops: [
          { name: 'Police Station', distance: '500m', icon: 'shield-checkmark' },
          { name: 'Hospital', distance: '1km', icon: 'medical' },
          { name: 'Busy Market', distance: '800m', icon: 'storefront' },
        ],
        tips: [
          'Stay on main roads',
          'Avoid the alley near checkpoint 2',
          'Police patrolling active on this route',
        ],
      };
      setRoute(routeData);
      setLoading(false);
    }, 1500);
  };

  const openMaps = () => {
    if (!route) return;
    const waypoints = route.waypoints.map((w) => `${w.lat},${w.lng}`).join('/');
    Linking.openURL(`https://www.google.com/maps/dir/${waypoints}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Safe Route</Text>
      <Text style={styles.subtitle}>Get the safest path to your destination</Text>

      {/* From Location */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>From</Text>
        <TouchableOpacity style={styles.input} onPress={getCurrentLocation}>
          {fromLocation ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.locationText}>Current Location</Text>
            </View>
          ) : (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Tap to use current location</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* To Location */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>To</Text>
        <View style={styles.input}>
          <Ionicons name="navigate" size={20} color={colors.textMuted} />
          <Text
            style={styles.textInput}
            onPress={() => Alert.alert('Coming Soon', 'Destination search coming soon')}
          >
            {toLocation || 'Enter destination'}
          </Text>
        </View>
      </View>

      {/* Find Route Button */}
      <TouchableOpacity
        style={[styles.findButton, loading && styles.findButtonDisabled]}
        onPress={findRoute}
        disabled={loading}
      >
        <Ionicons name="search" size={20} color={colors.textPrimary} />
        <Text style={styles.findButtonText}>
          {loading ? 'Finding safest route...' : 'Find Safe Route'}
        </Text>
      </TouchableOpacity>

      {/* Route Results */}
      {route && (
        <>
          {/* Route Summary */}
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View style={styles.safetyScore}>
                <Text style={styles.safetyScoreLabel}>Safety Score</Text>
                <Text style={[styles.safetyScoreValue, { color: route.safetyScore >= 80 ? colors.accentGreen : route.safetyScore >= 60 ? colors.accentGold : colors.danger }]}>
                  {route.safetyScore}
                </Text>
              </View>
              <View style={styles.routeMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.metaText}>{route.estimatedTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="navigate-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.metaText}>{route.distance}</Text>
                </View>
              </View>
            </View>

            {/* Route Waypoints */}
            <View style={styles.waypoints}>
              {route.waypoints.map((point, index: number) => (
                <View key={index} style={styles.waypoint}>
                  <View style={[styles.waypointDot, index === 0 && styles.waypointStart, index === route.waypoints.length - 1 && styles.waypointEnd]}>
                    <Ionicons
                      name={index === 0 ? 'location' : index === route.waypoints.length - 1 ? 'flag' : 'location'}
                      size={14}
                      color={colors.textPrimary}
                    />
                  </View>
                  {index < route.waypoints.length - 1 && <View style={styles.waypointLine} />}
                  <View style={styles.waypointInfo}>
                    <Text style={styles.waypointName}>{point.name}</Text>
                    {point.note && <Text style={styles.waypointNote}>{point.note}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Safe Stops */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safe Stops Along Route</Text>
            {route.safeStops.map((stop, index: number) => (
              <View key={index} style={styles.safeStop}>
                <Ionicons name={stop.icon as any} size={20} color={colors.accentGreen} />
                <View style={styles.safeStopInfo}>
                  <Text style={styles.safeStopName}>{stop.name}</Text>
                  <Text style={styles.safeStopDistance}>{stop.distance} away</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Safety Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            {route.tips.map((tip: string, index: number) => (
              <View key={index} style={styles.tip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Start Navigation */}
          <TouchableOpacity style={styles.navigateButton} onPress={openMaps}>
            <Ionicons name="navigate" size={20} color={colors.textPrimary} />
            <Text style={styles.navigateText}>Start Navigation</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Quick Destinations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Destinations</Text>
        <View style={styles.quickDest}>
          <TouchableOpacity style={styles.quickDestItem}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.quickDestLabel}>Police Station</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickDestItem}>
            <Ionicons name="medical" size={24} color={colors.danger} />
            <Text style={styles.quickDestLabel}>Hospital</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickDestItem}>
            <Ionicons name="home" size={24} color={colors.accentGreen} />
            <Text style={styles.quickDestLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickDestItem}>
            <Ionicons name="business" size={24} color={colors.accentGold} />
            <Text style={styles.quickDestLabel}>Office</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  inputSection: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationText: { fontSize: 14, color: colors.primary },
  placeholderText: { fontSize: 14, color: colors.textMuted },
  textInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
  findButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, padding: 16, gap: 8, marginBottom: 24 },
  findButtonDisabled: { opacity: 0.7 },
  findButtonText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  routeCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  safetyScore: { alignItems: 'center' },
  safetyScoreLabel: { fontSize: 12, color: colors.textMuted },
  safetyScoreValue: { fontSize: 36, fontWeight: 'bold' },
  routeMeta: { justifyContent: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: colors.textSecondary },
  waypoints: { gap: 4 },
  waypoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  waypointDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  waypointStart: { backgroundColor: colors.primary },
  waypointEnd: { backgroundColor: colors.accentGreen },
  waypointLine: { width: 2, height: 24, backgroundColor: colors.surfaceLight, marginLeft: 11 },
  waypointInfo: { flex: 1, paddingTop: 2 },
  waypointName: { fontSize: 14, color: colors.textPrimary },
  waypointNote: { fontSize: 12, color: colors.accentGreen, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  safeStop: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  safeStopInfo: { flex: 1 },
  safeStopName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  safeStopDistance: { fontSize: 12, color: colors.textMuted },
  tip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  tipText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  navigateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentGreen, borderRadius: 12, padding: 16, gap: 8, marginBottom: 24 },
  navigateText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  quickDest: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickDestItem: { width: '48%', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 8 },
  quickDestLabel: { fontSize: 12, color: colors.textSecondary },
});
